/* tslint:disable:no-var-requires */
/**
 * Keep sending redeem txes to fetch uncle blocks, the
 * block data will save at `${config.root}/crash_block.db`
 * with `sqlite3`.
 */
import { Service } from "./service";
import abi from "./static/abi.json";
import * as path from "path";
import { autoWeb3, Web3 } from "@darwinia/api";
import { Config, log } from "@darwinia/util";

/**
 * build the burn contract in darwinia
 */
function burn(web3: any, addr: any): any {
    return new web3.eth.Contract(abi, "0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0")
        .methods.transferFrom(
            addr,
            "0xdBC888D701167Cbfb86486C516AafBeFC3A4de6e",
            "1000000000000000000",
            "0x2ad7b504ddbe25a05647312daa8d0bbbafba360686241b7e193ca90f9b01f95faa",
        );
}
/**
 * Keep sending tx to darwinia and fetch all blocks contain our txes.
 *
 * @property {Config} config - darwinia.js config
 * @property {String} addr - address of your ethereum account
 * @property {Contract} contract - darwinia burn contract
 * @property {Knex} knex - database orm
 * @property {Bool} alive - service flag
 * @property {Number} receipt - the count of receipt number
 * @property {Number} sent - the count of sent txes
 * @property {Web3} web - darwinia web3
 */
export default class Redeem extends Service {
    public static async new(): Promise<Redeem> {
        const conf = new Config();
        const web3 = await autoWeb3();
        if (conf.eth.api.indexOf("mainnet") > -1) {
            log.ex([
                "DO NOT USE THIS COMMAND IN ETHEREUM MAINNET,",
                " THIS WILL BURN OUT ALL OF YOUR ETH!"
            ].join(""));
        }

        if (conf.eth.secret === "") {
            log.ex([
                "eth secret key is required for crash service, ",
                "please edit `~/.darwinia/dj.json` to add it on",
            ].join(""));
        }

        return new Redeem(conf, web3);
    }

    public port: number;
    protected config: Config;
    private addr: string;
    private contract: any;
    private knex: any;
    private alive: boolean;
    private receipt: number;
    private sent: number;
    private web3: Web3;

    constructor(config: Config, web3: Web3) {
        super();
        this.config = config;
        const dbPath = path.resolve(config.path.db.crash);

        // init sqlite3 to save txs
        this.knex = require("knex")({
            client: "sqlite3",
            connection: {
                filename: dbPath,
            },
            useNullAsDefault: true,
        });

        // properties
        this.web3 = web3;
        this.alive = false;
        this.receipt = 0;
        this.sent = 0;
        this.port = 0;
        this.addr = this.web3._.eth.accounts.wallet[0].address;
        this.contract = burn(this.web3, this.addr);
        log.trace(dbPath);
    }

    /**
     * @deprecated no need to serve
     */
    public async serve(port: number): Promise<void> {
        log.warn(`the expect port is ${port}, the server of relay is not completed`);
        await this.start();
    }

    /**
     * Start crash service
     */
    public async start(): Promise<void> {
        log("start tx alive...");
        await this.checkTable();

        this.tx().catch(() => {
            log.err("tx alive got broken.");
        });
    }

    /**
     * stop crash service
     */
    public async stop(): Promise<void> {
        this.alive = false;
    }

    /**
     * check table exists
     */
    private async checkTable(): Promise<void> {
        const exists = await this.knex.schema.hasTable("blocks");
        if (!exists) {
            this.knex.schema.createTable("blocks", (table: any) => {
                table.integer("height");
                table.string("tx");
            }).catch((_: any) => console.error);
        }

        await this.knex("blocks").count("tx").then((r: any) => {
            this.sent = r[0]["count(`tx`)"];
            this.receipt = r[0]["count(`tx`)"];
            log(`now we have sent ${this.sent} txes, received ${this.receipt} txes`);
        });
    }

    /**
     * send redeem tx
     */
    private async tx(): Promise<void> {
        this.sent += 1;

        log(`sending the ${this.sent}-th tx...`);
        log(`${new Date().toLocaleString()}`);

        await this.contract.send({
            from: this.addr,
            gas: 1000000,
        })
            .on("receipt", (r: any) => {
                this.receipt += 1;
                log.trace(`receiving the ${this.receipt}-th tx`);
                log.ok(`block(${r.blockNumber}) tx(${r.transactionHash})`);
                this.knex("blocks").insert({
                    height: r.blockNumber,
                    tx: r.transactionHash,
                }).catch(() => {
                    log.err("insert block info to db failed.");
                });
            })
            .catch(() => {
                log.err("send tx failed.");
            });

        if (this.alive) {
            await this.tx();
        }
    }
}
