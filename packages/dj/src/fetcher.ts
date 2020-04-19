/* tslint:disable:no-var-requires */
import Koa from "koa";
import * as path from "path";
import { BlockWithProof, Config, IDarwiniaEthBlock, log } from "@darwinia/util";
import { autoWeb3, Web3 } from "@darwinia/api";
import { Service } from "./service";

export interface IFetcherConfig {
    config: Config;
    count: number;
    knex: any;
    max: number;
    web3: Web3;
}

/**
 * @property {Number} max - max height of local eth blocks
 * @property {Number} count - the total count of local eth blocks
 * @property {Web3} web3 - darwinia web3
 * @property {Bool} alive - service flag
 * @property {Config} config - darwinia.js config
 * @property {Knex} knex - database orm
 */
export default class Fetcher extends Service {
    /**
     * Check if table exists, remove outdated blocks
     *
     * @param {Knex} knex - knex orm
     * @param {Number} start - delete block before start
     */
    public static async checkTable(knex: any, start?: number) {
        const exists = await knex.schema.hasTable("blocks");
        if (!exists) {
            await knex.schema.createTable("blocks", (table: any) => {
                table.integer("height").unique();
                table.string("block").unique();
                table.string("proof").unique();
            });
        } else {
            if (start) {
                await knex("blocks").where("height", "<", start).del();
            }
        }
    }

    /**
     * Async init fetcher service
     *
     * @return {Promise<Fetcher>} fetcher service
     */
    public static async new(): Promise<Fetcher> {
        const config = new Config();
        const web3 = await autoWeb3();


        const dbPath = path.resolve(config.path.db.fetcher);

        // init sqlite3 to save blocks
        const knex = require("knex")({
            client: "sqlite3",
            connection: {
                filename: dbPath,
            },
            useNullAsDefault: true,
        });

        // check table exists
        await Fetcher.checkTable(knex);
        log.trace(dbPath);

        // knex infos
        const max = await knex("blocks").max("height");
        const count = await knex("blocks").count("height");

        return new Fetcher({
            config,
            count: count[0]["count(`height`)"],
            knex,
            max: max[0]["max(`height`)"],
            web3,
        });
    }

    public max: number;
    public count: number;
    public port: number;
    public web3: Web3;
    protected alive: boolean;
    protected config: Config;
    private knex: any;

    /**
     * Recommend to use `Fetcher.new()` instead
     *
     * @param {Config} config - darwinia.js Config
     * @param {Web3} web - darwinia.js Web3
     */
    constructor(config: IFetcherConfig) {
        super();
        this.alive = false;
        this.config = config.config;
        this.count = config.count;
        this.knex = config.knex;
        this.max = config.max;
        this.port = 0;
        this.web3 = config.web3;
    }

    /**
     * Get block from sqlite
     *
     * @param {Number} num - block number
     * @return {IDarwiniaEthBlock} block - darwinia style eth block
     */
    public async getBlock(height: number): Promise<BlockWithProof> {
        const tx = await this.knex("blocks")
            .select("*")
            .whereRaw(`blocks.height = ${height}`);

        const proof = await this.config.proofBlock(height);
        if (tx.length === 0) {
            return [await this.web3.getBlock(height), proof];
        } else {
            return [JSON.parse(tx[0].block), proof];
        }
    }

    /**
     * Serve the fetcher service
     *
     * @example GET `/block/{number}`
     */
    public async serve(port: number): Promise<void> {
        // start the fetcher
        this.start();

        // start server
        const app = new Koa();
        app.use(async (ctx) => {
            const block = ctx.url.match(/\/block\/(\d+)/);
            if (block) {
                const num: string = block[1];
                const pair = await this.getBlock(Number(num));
                const dBlock = pair[0];
                (dBlock as any).proof = pair[1];

                ctx.body = dBlock;
            } else {
                ctx.body = "hello";
            }
        });

        log(`fetcher server start at ${port}`);
        app.listen(port);
    }

    /**
     * Alive block and tx to sqlite
     *
     * @param {Number} start - the start height of etherebum block
     */
    public async start(start?: number): Promise<void> {
        let dimStart: number = 0;
        await Fetcher.checkTable(this.knex, start);

        if (start === undefined) {
            const max = await this.knex("blocks").max("height");
            if (max[0]["max(`height`)"]) {
                dimStart = max[0]["max(`height`)"];
            } else {
                dimStart = 0;
            }
        } else {
            dimStart = start;
        }

        // set status
        const count = await this.knex("blocks").count("height");
        this.count = count[0]["count(`height`)"];
        this.alive = true;
        log.trace(`start fetching eth headers from ${start}...`);

        await this.fetch(dimStart);
    }

    /**
     * We can restart `Fetcher` just by runing `this.start()` again.
     */
    public async stop(): Promise<void> {
        this.alive = false;
    }


    /**
     * Check if fetcher is running
     */
    public status(): boolean {
        return this.alive;
    }

    /**
     * Get ethereum headers, restart when
     *
     * - has fetched
     * - got null block
     * - reach the lastest block
     *
     * @param {Number} height - ethereum block height
     */
    public async fetch(height: number): Promise<void> {
        const exists = await this.knex("blocks").whereExists(
            this.knex("blocks").select("height").whereRaw(`blocks.height = ${height}`),
        );

        if (exists.length > 0) {
            log.trace("header exists, move to next...");
            return await this.fetch(height + 1);
        }

        log.trace(`fetching the ${height} block...`);
        const block: IDarwiniaEthBlock = await this.web3.getBlock(
            height,
        );

        if (block) {
            log.trace(`got block ${block.number} - ${block.hash}`);
            log.trace(`\t${JSON.stringify(block)}`);
            const proof = await this.config.proofBlock((block.number as number));
            await this.knex("blocks").insert({
                block: JSON.stringify(block),
                height,
                proof: JSON.stringify(proof),
            });

            // keep fetching
            this.max = height;
            if (this.alive) {
                await this.fetch(height + 1);
            }
        } else {
            await this.restart(height);
        }
    }

    /**
     * Restart fetcher
     *
     * @param {Number} height - ethereum block height
     */
    private async restart(height: number) {
        log.warn("reached the lastest block, sleep for 10 seconds");
        await new Promise(async () => setTimeout(async () => {
            await this.fetch(height);
        }, 10000));
    }
}
