/* tslint:disable:no-var-requires */
import Jayson from "jayson";
import * as path from "path";
import { BlockWithProof, Config, IDarwiniaEthBlock, log } from "@darwinia/util";
import { autoAPI, autoWeb3, Web3, API } from "@darwinia/api";
import { Vec, Struct } from "@polkadot/types";
import { Service } from "./service";

export interface IShadowConfig {
    ap: API;
    config: Config;
    count: number;
    knex: any;
    max: number;
    web3: Web3;
}

export interface CodecResp {
    header: string;
    proof: string;
}

/**
 * @property {Number} max - max height of local eth blocks
 * @property {Number} count - the total count of local eth blocks
 * @property {Web3} web3 - darwinia web3
 * @property {Bool} alive - service flag
 * @property {Config} config - darwinia.js config
 * @property {Knex} knex - database orm
 */
export default class Shadow extends Service {
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
     * Async init shadow service
     *
     * @return {Promise<Shadow>} shadow service
     */
    public static async new(): Promise<Shadow> {
        const config = new Config();
        const ap = await autoAPI();
        const web3 = await autoWeb3();
        const dbPath = path.resolve(config.path.db.shadow);

        // init sqlite3 to save blocks
        const knex = require("knex")({
            client: "sqlite3",
            connection: {
                filename: dbPath,
            },
            useNullAsDefault: true,
        });

        // check table exists
        await Shadow.checkTable(knex);
        log.trace(dbPath);

        // knex infos
        const max = await knex("blocks").max("height");
        const count = await knex("blocks").count("height");

        return new Shadow({
            ap,
            config,
            count: count[0]["count(`height`)"],
            knex,
            max: max[0]["max(`height`)"],
            web3,
        });
    }

    public ap: API;
    public max: number;
    public count: number;
    public port: number;
    public web3: Web3;
    protected alive: boolean;
    protected config: Config;
    private knex: any;

    /**
     * Recommend to use `Shadow.new()` instead
     *
     * @param {Config} config - darwinia.js Config
     * @param {Web3} web - darwinia.js Web3
     */
    constructor(config: IShadowConfig) {
        super();
        this.ap = config.ap;
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
     * Serve the shadow service
     *
     * @example GET `/block/{number}`
     */
    public async serve(port: number): Promise<void> {
        // start the shadow
        this.start();

        const rpc = new Jayson.Server({
            shadow_getEthHeaderWithProofByNumber: async (args: any, cb: any) => {
                const blockNumber: number = args.block_num;
                // const transacation: boolean = args.transaction;
                const options: Record<string, any> = args.options;
                const pair = await this.getBlock(blockNumber);
                const resp = {
                    eth_header: pair[0],
                    proof: pair[1],
                };

                // format block to resp
                (resp.eth_header.difficulty as any) = "0x" + resp.eth_header.difficulty.toString(16);
                (resp.eth_header.gas_used as any) = "0x" + resp.eth_header.gas_used.toString(16);
                (resp.eth_header.gas_limit as any) = "0x" + resp.eth_header.gas_limit.toString(16);
                (resp.eth_header.extra_data as any) = Object.values(Uint8Array.from(
                    Buffer.from(resp.eth_header.extra_data.slice(2), "hex")
                ));
                (resp.eth_header.seal as any) = [
                    Object.values(Uint8Array.from(Buffer.from(resp.eth_header.seal[0].slice(2), "hex"))),
                    Object.values(Uint8Array.from(Buffer.from(resp.eth_header.seal[1].slice(2), "hex"))),
                ]

                // scale condition
                if (options.format === "scale") {
                    (resp.eth_header as any) = new Struct(
                        this.ap._.registry,
                        this.config.types.EthHeader,
                        pair[0]
                    ).toHex();

                    (resp.proof as any) = new Vec(
                        this.ap._.registry,
                        (this.ap._.registry.get("DoubleNodeWithMerkleProof") as any),
                        pair[1],
                    ).toHex();
                }

                cb(null, resp);
            }
        });

        log(`shadow server start at ${port}`);
        rpc.http().listen(port);
    }

    /**
     * Alive block and tx to sqlite
     *
     * @param {Number} start - the start height of etherebum block
     */
    public async start(start?: number): Promise<void> {
        let dimStart: number = 0;
        await Shadow.checkTable(this.knex, start);

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
     * We can restart `Shadow` just by runing `this.start()` again.
     */
    public async stop(): Promise<void> {
        this.alive = false;
    }

    /**
     * Check if shadow is running
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
            const proof = await this.config.proofBlock(block.number);
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
     * Restart shadow
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
