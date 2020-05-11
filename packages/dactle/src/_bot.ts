import fs from "fs";
import path from "path";
import * as yml from "js-yaml";
import { API, autoAPI, ExResult } from "@darwinia/api";
import { Config, log } from "@darwinia/util";
import TelegramBot from "node-telegram-bot-api"
import BotDb from "./_db";

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
    talk: string;
    more: string;
    about: string;
    faucet: IFaucetGrammers;
}

/**
 * this is the interface of Grammer service
 */
export interface IGrammerConfig {
    api: API;
    config: Config;
    grammer: IGrammer;
    db: BotDb;
}

/**
 * Grammer Service
 *
 * @property {Config} config - dj.json
 * @property {Number} port - port of grammer server
 * @property {API} api - darwinia api
 * @property {IGrammerCommandsConfig} commands - commands config from `dj.json`
 * @property {IGrammer} grammer - grammer config from `grammer.yml`
 */
export default class Grammer {
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

        const db: BotDb = new BotDb(
            path.resolve(config.path.root, "cache/boby.json"),
            grammer.faucet.config.supply,
        );

        return new Grammer({ api, config, grammer, db });
    }

    protected config: Config;
    private api: API;
    private grammer: IGrammer;
    private db: BotDb;

    constructor(conf: IGrammerConfig) {
        this.api = conf.api;
        this.config = conf.config;
        this.grammer = conf.grammer;
        this.db = conf.db;
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
        bot.onText(/\/talk/, (message) => {
            bot.sendMessage(message.chat.id, this.grammer.talk);
        });
        bot.onText(/\/more/, (message) => {
            bot.sendMessage(message.chat.id, this.grammer.more);
        });
        bot.onText(/\/about/, (message) => {
            bot.sendMessage(message.chat.id, this.grammer.about);
        });
        bot.onText(/\/faucet/, async (message) => {
            bot.sendMessage(message.chat.id, await this.transfer(bot, message));
        });
    }

    /**
     * Transfer some ring wich multi-checks
     *
     * @param {String} addr - the target address
     */
    private async transfer(bot: TelegramBot, msg: TelegramBot.Message): Promise<string> {
        if (
            msg.text === undefined ||
            msg.from === undefined ||
            msg.from.username === undefined
        ) {
            return this.grammer.faucet.address;
        }

        // Get addr
        const matches = msg.text.match(/\/(\w+)\S+\s+(\S+)/);
        if (matches === null || matches.length < 3) {
            return this.grammer.faucet.address;
        }

        const addr = matches[2];
        log.trace(`trying to tansfer to ${addr}`);
        if (addr.indexOf("CRAB") < 0 || addr.length !== 48) {
            return this.grammer.faucet.address;
        }

        // check addr
        if (this.db.hasReceived(addr)) {
            return this.grammer.faucet.received;
        }

        // check supply
        const date = new Date().toJSON().slice(0, 10);
        if (!this.db.hasSupply(date)) {
            return this.grammer.faucet.supply;
        }

        // check user
        const nextDrop: number = this.db.nextDrop(
            msg.from.username,
            this.grammer.faucet.config.interval
        );

        if (nextDrop > 0) {
            return this.grammer.faucet.interval.replace(
                "${hour}", Math.floor(nextDrop).toString()
            );
        }

        // transfer to address
        bot.sendMessage(msg.chat.id, "Copy that! Well! Oh yes wait a minute mister postman!");
        let hash = "";
        const ex = await this.api.transfer(
            addr, this.grammer.faucet.config.amount * 1000000000
        ).catch(() => {
            hash = "";
        });

        // return exHash
        if (ex) {
            hash = (ex as ExResult).exHash;
            this.db.burnSupply(date);
            this.db.lastDrop(msg.from.username, new Date().getTime())
            return this.grammer.faucet.succeed.replace("${hash}", hash);
        } else {
            return this.grammer.faucet.failed;
        }
    }
}
