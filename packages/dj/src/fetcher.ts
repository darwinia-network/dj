/* tslint:disable:no-var-requires */
import * as path from "path";
import { Config, IDarwiniaEthBlock, log } from "@darwinia/util";
import { autoWeb3, Web3 } from "@darwinia/api";
import { Service } from "./service";

export interface IFetcherConfig {
    conf: Config;
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
            knex.schema.createTable("blocks", (table: any) => {
                table.integer("height").unique();
                table.string("block").unique();
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
        const conf = new Config();
        const web3 = await autoWeb3();

        const dbPath = path.resolve(
            conf.path.root,
            "database/relay_blocks.db",
        );

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
            conf,
            count: count[0]["count(`height`)"],
            knex,
            max: max[0]["max(`height`)"],
            web3,
        });
    }

    public max: number;
    public count: number;
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
        this.config = config.conf;
        this.count = config.count;
        this.knex = config.knex;
        this.alive = false;
        this.max = config.max;
        this.web3 = config.web3;
    }

    /**
     * Get block from sqlite
     *
     * @param {Number} num - block number
     * @return {IDarwiniaEthBlock} block - darwinia style eth block
     */
    public async getBlock(height: number): Promise<IDarwiniaEthBlock> {
        const tx = await this.knex("blocks")
            .select("*")
            .whereRaw(`blocks.height = ${height}`);

        if (tx.length === 0) {
            return await this.web3.getBlock(height);
        } else {
            return JSON.parse(tx[0].block);
        }
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
            dimStart = max[0]["max(`height`)"];
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
            await this.knex("blocks").insert({
                block: JSON.stringify(block),
                height,
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
