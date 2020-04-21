/* tslint:disable:no-var-requires */
import "graphql-import-node";
import { ApolloServer } from 'apollo-server';
import fs from "fs";
import * as yml from "js-yaml";
import { API, autoAPI, ExResult } from "@darwinia/api";
import { Config, log } from "@darwinia/util";
import { Service } from "./service";
import * as GrammerSchema from "./static/schema.gql";


type ParentQuery = any;

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
}

export interface IGrammer {
    help: string;
    docs: string;
    book: string;
    more: string;
    faucet: IFaucetGrammers;
}

/**
 * grammer config - the config below will generate from `dj.json`
 */
export interface IGrammerCommandFaucetConfig {
    supply: number;
    amount: number;
    interval: number;
}

export interface IGrammerCommandsConfig {
    faucet: IGrammerCommandFaucetConfig;
}

/**
 * this is the interface of Grammer service
 */
export interface IGrammerConfig {
    api: API;
    commands: IGrammerCommandsConfig;
    config: Config;
    grammer: IGrammer;
    knex: any;
}

/**
 * Grammer Service
 *
 * @property {Config} config - dj.json
 */
export default class Grammer extends Service {
    /**
     * Check if table exists, remove outdated blocks
     *
     * @param {Knex} knex - knex orm
     * @param {Number} start - delete block before start
     */
    public static async checkTable(knex: any) {
        const addressExists = await knex.schema.hasTable("address");
        const faucetExists = await knex.schema.hasTable("faucet");

        if (!addressExists) {
            await knex.schema.createTable("address", (table: any) => {
                table.string("address").unique();
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
            fs.readFileSync(config.path.grammer, "utf8")
        );
        const commands: IGrammerCommandsConfig = JSON.parse(fs.readFileSync(
            config.path.conf, "utf8"
        )).grammer;

        const knex = require("knex")({
            client: "sqlite3",
            connection: {
                filename: config.path.db.grammer,
            },
            useNullAsDefault: true,
        });

        await Grammer.checkTable(knex);
        return new Grammer({
            api,
            commands,
            config,
            grammer,
            knex,
        });
    }

    public port: number;
    protected config: Config;
    private api: API;
    private commands: IGrammerCommandsConfig;
    private grammer: IGrammer;
    private knex: any;

    constructor(conf: IGrammerConfig) {
        super();
        this.api = conf.api;
        this.config = conf.config;
        this.commands = conf.commands;
        this.grammer = conf.grammer;
        this.knex = conf.knex;
        this.port = 1439;
    }

    public async serve(port: number) {
        const server = new ApolloServer({
            typeDefs: GrammerSchema,
            resolvers: {
                Query: {
                    answer: async (
                        _parent: ParentQuery,
                        args: ICommandArgs,
                    ) => {
                        switch (args.ident) {
                            case "docs":
                                return this.grammer.docs;
                            case "book":
                                return this.grammer.book;
                            case "more":
                                return this.grammer.more;
                            case "faucet":
                                return await this.transfer(args.message);
                            default:
                                return this.grammer.help;
                        }
                    }
                }
            }
        });

        server.listen(port).then(() => {
            log(`Grammer server is ready at ${port}`);
        });
    }

    public async start() {
        this.serve(this.port);
    }

    public async stop() {
        log.ox("grammer server has stopped");
    }

    private async transfer(addr: string): Promise<string> {
        // check address
        addr = addr.trim();
        if (addr.indexOf("CRAB") < 0 || addr.length !== 48) {
            return this.grammer.faucet.address;
        }

        // query database
        let supply: number = this.commands.faucet.supply;
        const date = new Date().toJSON().slice(0, 10);
        const supplyQuery = await this.knex.table("faucet")
            .select("*")
            .whereRaw(`faucet.date = "${date}"`);

        const addrQuery = await this.knex.table("address")
            .select("*")
            .whereRaw(`address.address = "${addr}"`);

        // check record
        if (supplyQuery.length === 0) {
            await this.knex.table("faucet").insert({ date, supply });
        } else {
            supply = supplyQuery[0].supply;
        }

        if (addrQuery.length === 0) {
            addrQuery[0] = {
                address: addr,
                last: 0,
            };

            await this.knex.table("address").insert(addrQuery[0]);
        }

        // check if supply runs out
        if (supply === 0) {
            return this.grammer.faucet.supply;
        }

        // check if has got ring in era
        const sub: number = ((new Date().getTime() - addrQuery[0].last) / 1000 / 60 / 60);
        if (sub <= this.commands.faucet.interval) {
            return this.grammer.faucet.interval.replace(
                "${hour}", Math.floor((this.commands.faucet.interval - sub)).toString()
            );
        }

        // transfer to address
        let hash = "";
        const ex = await this.api.transfer(
            addr, this.commands.faucet.amount
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

            await this.knex.table("address").where({
                address: addr,
            }).update({
                last: new Date().getTime(),
            });

            return this.grammer.faucet.succeed.replace("${hash}", hash);
        } else {
            return this.grammer.faucet.failed;
        }
    }
}
