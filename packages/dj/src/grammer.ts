import "graphql-import-node";
import { ApolloServer } from 'apollo-server';
import fs from "fs";
import * as yml from "js-yaml";
import { API, autoAPI } from "@darwinia/api";
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

export interface IGrammerRawConfig {
    commands: IGrammerCommandsConfig;
    port: number;
}

/**
 * this is the interface of Grammer service
 */
export interface IGrammerConfig {
    api: API;
    commands: IGrammerCommandsConfig;
    config: Config;
    grammer: IGrammer;
    port: number;
}

/**
 * Grammer Service
 *
 * @property {Config} config - dj.json
 */
export class Grammer extends Service {
    static async new(): Promise<Grammer> {
        const api = await autoAPI();
        const config = new Config();
        const grammer: IGrammer = yml.safeLoad(
            fs.readFileSync(config.path.grammer, "utf8")
        );
        const rawConfig: IGrammerRawConfig = JSON.parse(fs.readFileSync(
            config.path.conf, "utf8"
        )).grammer;

        return new Grammer({
            api,
            commands: rawConfig.commands,
            config,
            port: rawConfig.port,
            grammer,
        });
    }

    public port: number;
    protected config: Config;
    private api: API;
    private commands: IGrammerCommandsConfig;
    private grammer: IGrammer;

    constructor(conf: IGrammerConfig) {
        super();
        this.api = conf.api;
        this.config = conf.config;
        this.commands = conf.commands;
        this.grammer = conf.grammer;
        this.port = conf.port;
    }

    public async serve(port: number) {
        const server = new ApolloServer({
            typeDefs: GrammerSchema,
            resolvers: {
                Query: {
                    answer: (
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
                                return this.grammer.faucet.supply;
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
}
