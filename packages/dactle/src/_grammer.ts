import fs from "fs";
import os from "os";
import path from "path";
import * as yml from "js-yaml";
import { API, autoAPI, ExResult } from "@darwinia/api";
import { Config, log } from "@darwinia/util";
import TelegramBot from "node-telegram-bot-api"
import { BotDb, JDb, RDb } from "./db";

/**
 * Constants
 */
const LOCKER = path.resolve(os.tmpdir(), "faucet.lock");
const STATIC_GRAMMER_CONFIG: string = path.resolve(__dirname, "static/grammer.yml");

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
    only: string;
    invite: string;
    invalid: string;
    empty: string;
    prefix: string;
    length: string;
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
    dev: string;
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
 * @property {Config} config - ~/.darwinia/config.json
 * @property {Number} port - port of grammer server
 * @property {API} api - darwinia api
 * @property {IGrammerCommandsConfig} commands - commands config from `dj.json`
 * @property {IGrammer} grammer - grammer config from `grammer.yml`
 */
export default class Grammer {
    /**
     * Async init grammer service
     *
     * @param {string} grammerConfig - the path of grammer.yml
     * @param {number} port          - redis port
     * @param {string} host          - redis host
     * @returns {Promise<Grammer>} grammer service
     */
    static async new(
        grammerConfig = STATIC_GRAMMER_CONFIG,
        rdb = true,
        port = 6379,
        host = "0.0.0.0"
    ): Promise<Grammer> {
        // revert config if path is empty
        if (grammerConfig === "") {
            grammerConfig = STATIC_GRAMMER_CONFIG;
        }

        // Check ENV
        if (process.env.DACTLE_REDIS_PORT) {
            port = Number.parseInt(process.env.DACTLE_REDIS_PORT, 10);
        }

        if (process.env.DACTLE_REDIS_HOST) {
            host = process.env.DACTLE_REDIS_HOST;
        }

        // Generate API
        const api = await autoAPI();
        const config = new Config();
        const grammer: IGrammer = yml.safeLoad(fs.readFileSync(grammerConfig, "utf8")) as IGrammer;
        let db: BotDb;
        if (rdb) {
            db = new RDb(port, host);
        } else {
            db = new JDb(
                path.resolve(config.path.root, "cache/boby.json"),
                grammer.faucet.config.supply,
            );
        }

        return new Grammer({ api, config, grammer, db });
    }

    static checkMsg(msg: TelegramBot.Message): boolean {
        if (
            msg.reply_to_message === undefined ||
            msg.reply_to_message.from === undefined ||
            msg.reply_to_message.from.id

        ) {
            return false;
        }

        return true;
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
        // run locker
        this.locker();

        // start bot
        const bot = new TelegramBot(key, { polling: true });
        bot.on("polling_error", (msg) => log.err(msg));
        bot.onText(/^\/\w+/, async (msg) => {
            if (msg.text === undefined) {
                return false;
            }

            const match = msg.text.match(/\/\w+/);
            if (match === null) {
                return;
            }

            // reply
            const sentMsg = await bot.sendMessage(
                msg.chat.id,
                await this.reply(bot, msg, match[0].slice(1)),
                {
                    reply_to_message_id: msg.message_id,
                }
            )

            // check if should delete message
            const that = this;
            if (sentMsg.text) {
                if (sentMsg.text && (
                    sentMsg.text === this.grammer.faucet.only.trim() ||
                    sentMsg.text === this.grammer.faucet.invite.trim()
                )) {
                    await this.deleteMsg(bot, msg);
                    setTimeout(async () => {
                        await that.deleteMsg(bot, sentMsg);
                    }, 30000);
                }
            }
        });
    }

    private async locker() {
        const that = this;
        setInterval(async () => {
            const balance = await that.api.getBalance(that.api.account.address);
            if (Number.parseInt(balance, 10) < 1000 * 1000000000) {
                fs.writeFileSync(LOCKER, "");
            } else {
                if (fs.existsSync(LOCKER)) {
                    fs.unlinkSync(LOCKER);
                }
            }
        }, 1000 * 30);
    }

    private async reply(
        bot: TelegramBot,
        msg: TelegramBot.Message,
        cmd: string
    ): Promise<string> {
        switch (cmd) {
            case "book":
                return this.grammer.book;
            case "docs":
                return this.grammer.docs;
            case "dev":
                return this.grammer.dev;
            case "talk":
                return this.grammer.talk;
            case "more":
                return this.grammer.more;
            case "about":
                return this.grammer.about;
            case "faucet":
                if (fs.existsSync(LOCKER)) {
                    return this.grammer.faucet.failed;
                } else {
                    return await this.transfer(bot, msg);
                }
            default:
                return this.grammer.help;
        }
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
            msg.from.id === undefined
        ) {
            return this.grammer.faucet.invalid;
        }

        // Check if user in channel @DarwiniaFaucet
        if (msg.chat.id !== -1001364443637) {
            return this.grammer.faucet.invite;
        }

        // Check if user in channel @DarwiniaNetwork
        try {
            const res = await bot.getChatMember("@DarwiniaNetwork", msg.from.id.toString());
            const status: string = res.status;
            if (
                status !== "creator" &&
                status !== "member" &&
                status !== "administrator"
            ) {
                return this.grammer.faucet.only;
            }
        } catch (e) {
            log.err(e);
            return this.grammer.faucet.only;
        }

        // check supply
        const date = new Date().toJSON().slice(0, 10);
        const hasSupply = await this.db.hasSupply(date, this.grammer.faucet.config.supply);
        if (!hasSupply) {
            return this.grammer.faucet.supply;
        }

        // check user
        const nextDrop: number = await this.db.nextDrop(
            msg.from.id,
            this.grammer.faucet.config.interval
        );

        if (nextDrop > 0) {
            return this.grammer.faucet.interval.replace(
                "${hour}", Math.floor(nextDrop).toString()
            );
        }

        // Get addr
        const matches = msg.text.match(/\/(\w+)\s+(\S+)/);
        if (matches === null || matches.length < 3) {
            return this.grammer.faucet.empty;
        }

        const addr = matches[2];
        log.trace(`${new Date()} trying to tansfer to ${addr}`);
        if (addr.length !== 48) {
            return this.grammer.faucet.length;
        } else if (!addr.startsWith("5")) {
            return this.grammer.faucet.prefix;
        } else if (!addr.match(/CRAB/g)) {
            return this.grammer.faucet.address;
        }

        // check addr
        const received: boolean = await this.db.hasReceived(addr);
        if (received) {
            log.trace(`${new Date()}: ${addr} has already reviced the airdrop`)
            return this.grammer.faucet.received;
        }

        // transfer to address
        bot.sendMessage(
            msg.chat.id,
            "Copy that! Well! Oh yes wait a minute mister postman!",
        );

        // check if tx failed
        let ex: ExResult | null = null;
        try {
            // /// **Ugly FIX**
            // /// Check if the BUG comes from the ws connection problem
            // this.api._.disconnect();
            // this.api = await autoAPI();

            /// Transfer to account
            ex = await this.api.transfer(
                addr, this.grammer.faucet.config.amount * 1000000000
            );
        } catch (err) {
            log.err(err);
            return this.grammer.faucet.failed;
        }

        // return exHash
        if (ex && (ex as ExResult).isOk) {
            const hash = (ex as ExResult).exHash;
            await this.db.addAddr(addr);
            await this.db.burnSupply(date, this.grammer.faucet.config.supply);
            await this.db.lastDrop(msg.from.id, new Date().getTime())
            return this.grammer.faucet.succeed.replace("${hash}", hash);
        } else {
            return this.grammer.faucet.failed;
        }
    }

    private async deleteMsg(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
        await bot.deleteMessage(
            msg.chat.id, msg.message_id.toString(),
        ).catch((_: any) => {
            log.warn(`doesn't have the access for deleting messages`);
        });
    }
}
