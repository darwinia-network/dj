import fs from "fs";
import path from "path";
import * as yml from "js-yaml";
import { API, autoAPI, ExResult } from "@darwinia/api";
import { Config, log } from "@darwinia/util";
import TelegramBot from "node-telegram-bot-api"

/**
 * command arguments
 */
export interface ICommandArgs {
    ident: string;
    message: string;
}

/**
 * fault grammers - the config below will generate from `grammer.yml`
 *
 * @param succeed string - the succeed grammer, contains ${hash} to replace
 * @param interval string - response when req account has requested fault in current interval
 * @param supply string - the current supply of today has run out, wait for next day
 * @param address string - wrong address alert
 */
export interface IFaucetGrammers {
    failed: string;
    succeed: string;
    interval: string;
    supply: string;
    address: string;
    received: string;
    config: ICommandFaucetConfig;
}

export interface ICommandFaucetConfig {
    supply: number;
    amount: number;
    interval: number;
}

export interface IGrammer {
    help: string;
    docs: string;
    book: string;
    more: string;
    faucet: IFaucetGrammers;
}

/**
 * this is the interface of Grammer service
 */
export interface IGrammerConfig {
    api: API;
    config: Config;
    grammer: IGrammer;
    knex: any;
}

/**
 * Grammer Service
 *
 * @property {Config} config - dj.json
 * @property {Number} port - port of grammer server
 * @property {API} api - darwinia api
 * @property {IGrammerCommandsConfig} commands - commands config from `dj.json`
 * @property {IGrammer} grammer - grammer config from `grammer.yml`
 * @property {Knex} knex - address database
 */
export default class Grammer {
    /**
     * Check if table exists, remove outdated blocks
     *
     * @param {Knex} knex - knex orm
     * @param {Number} start - delete block before start
     */
    public static async checkTable(knex: any) {
        const addrExists = await knex.schema.hasTable("addr");
        const userExists = await knex.schema.hasTable("user");
        const faucetExists = await knex.schema.hasTable("faucet");

        if (!addrExists) {
            await knex.schema.createTable("addr", (table: any) => {
                table.string("value").unique();
            });
        }

        if (!userExists) {
            await knex.schema.createTable("user", (table: any) => {
                table.string("id").unique();
                table.integer("last");
            });
        }

        if (!faucetExists) {
            await knex.schema.createTable("faucet", (table: any) => {
                table.string("date").unique();
                table.integer("supply");
            });
        }
    }

    /**
     * Async init grammer service
     *
     * @return {Promise<Grammer>} grammer service
     */
    static async new(): Promise<Grammer> {
        const api = await autoAPI();
        const config = new Config();
        const grammer: IGrammer = yml.safeLoad(
            fs.readFileSync(path.resolve(__dirname, "static/grammer.yml"), "utf8")
        );

        // create cache path if not exists
        const cache = path.resolve(config.path.root, "cache");
        if (!fs.existsSync(cache)) {
            fs.mkdirSync(cache);
        }

        const knex = require("knex")({
            client: "sqlite3",
            connection: {
                filename: path.resolve(cache, "bot.db"),
            },
            useNullAsDefault: true,
        });

        await Grammer.checkTable(knex);
        return new Grammer({
            api,
            config,
            grammer,
            knex,
        });
    }

    public port: number;
    protected config: Config;
    private api: API;
    private grammer: IGrammer;
    private knex: any;

    constructor(conf: IGrammerConfig) {
        this.api = conf.api;
        this.config = conf.config;
        this.grammer = conf.grammer;
        this.knex = conf.knex;
        this.port = 1439;
    }

    /**
     * serve grammer with specfic key
     *
     * @param {string} key - telegram bot key
     */
    public async run(key: string) {
        const bot = new TelegramBot(key, { polling: true });
        bot.on("polling_error", (msg) => log.err(msg));
        bot.onText(/\/help/, (message) => {
            bot.sendMessage(message.chat.id, this.grammer.help);
        });
        bot.onText(/\/book/, (message) => {
            bot.sendMessage(message.chat.id, this.grammer.book);
        });
        bot.onText(/\/docs/, (message) => {
            bot.sendMessage(message.chat.id, this.grammer.docs);
        });
        bot.onText(/\/more/, (message) => {
            bot.sendMessage(message.chat.id, this.grammer.more);
        });
        bot.onText(/\/faucet/, async (message) => {
            bot.sendMessage(message.chat.id, await this.transfer(message));
        });
    }

    /**
     * Transfer some ring wich multi-checks
     *
     * @param {String} addr - the target address
     */
    private async transfer(msg: TelegramBot.Message): Promise<string> {
        if (
            msg.text === undefined ||
            msg.from === undefined
        ) {
            return this.grammer.faucet.address;
        }

        const matches = msg.text.match(/\/(\w+)\S+\s+(\S+)/);
        if (matches === null || matches.length < 3) {
            return this.grammer.faucet.address;
        }

        const addr = matches[3];
        log.trace(`trying to tansfer to ${addr}`);
        if (addr.indexOf("CRAB") < 0 || addr.length !== 48) {
            return this.grammer.faucet.address;
        }

        // check addr
        const addrQuery = await this.knex.table("addr")
            .select("*")
            .whereRaw(`addr.value = "${addr}"`);

        if (addrQuery.length === 0) {
            addrQuery[0] = {
                value: addr,
            };

            await this.knex.table("addr").insert(addrQuery);
        } else {
            return this.grammer.faucet.received;
        }

        // // check supply
        let supply: number = this.grammer.faucet.config.supply;
        const date = new Date().toJSON().slice(0, 10);
        const supplyQuery = await this.knex.table("faucet")
            .select("*")
            .whereRaw(`faucet.date = "${date}"`);

        if (supplyQuery.length === 0) {
            await this.knex.table("faucet").insert({ date, supply });
        } else {
            supply = supplyQuery[0].supply;
        }

        if (supply === 0) {
            return this.grammer.faucet.supply;
        }

        // check user
        const userQuery = await this.knex.table("user")
            .select("*")
            .whereRaw(`user.id = "${msg.from.id}"`);

        if (userQuery.length === 0) {
            userQuery[0] = {
                id: msg.from.id,
                last: 0,
            };

            await this.knex.table("user").insert(userQuery[0]);
        }

        // check if user has got ring in era
        const sub: number = ((new Date().getTime() - userQuery[0].last) / 1000 / 60 / 60);
        if (sub <= this.grammer.faucet.config.interval) {
            return this.grammer.faucet.interval.replace(
                "${hour}", Math.floor((this.grammer.faucet.config.interval - sub)).toString()
            );
        }

        // transfer to address
        let hash = "";
        const ex = await this.api.transfer(
            addr, this.grammer.faucet.config.amount * 1000000000
        ).catch(() => {
            hash = "";
        });

        // return exHash
        if (ex) {
            hash = (ex as ExResult).exHash;
            await this.knex.table("faucet").where({
                date,
            }).update({
                supply: supply - 1,
            });

            await this.knex.table("user").where({
                id: msg.from.id,
            }).update({
                last: new Date().getTime(),
            });

            return this.grammer.faucet.succeed.replace("${hash}", hash);
        } else {
            return this.grammer.faucet.failed;
        }
    }
}
