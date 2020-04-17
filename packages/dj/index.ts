#!/usr/bin/env node
import { log, whereisPj } from "@darwinia/util";
import yargs from "yargs";
import * as handlers from "./src/cmds";

/**
 * Output error syntax sugar
 *
 * @param {String} cmd - command string
 * @param {any} e - error
 */
function anyErrorYouLike(cms: string, e: any) {
    let s = e;
    if (e instanceof Object) {
        s = JSON.stringify(e);
    }

    log.err(s);
    log.ex(`${cms} failed`);
}

// main
(async () => {
    // enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "ALL";
    }

    // parser
    const _ = yargs
        .usage("dj <hello@darwinia.network>")
        .help("help").alias("help", "h")
        .version("version", whereisPj().version).alias("version", "V")
        .command({
            builder: (argv: yargs.Argv) => argv.default("address", ""),
            command: "balance [address]",
            describe: "Get balance of darwinia account",
            handler: async (args: yargs.Arguments) => {
                await handlers.balanceHandler(args).catch(
                    (e: any) => anyErrorYouLike("get balance", e),
                );
            },
        })
        .command({
            builder: (argv: yargs.Argv) => {
                return argv.positional("edit", {
                    alias: "e",
                    describe: "edit the config of darwinia.js",
                    default: false,
                    type: "boolean",
                }).positional("update", {
                    alias: "u",
                    describe: "update the types.json of darwinia.js",
                    default: false,
                    type: "boolean",
                });
            },
            command: "config [edit]",
            describe: "show config",
            handler: async (args: yargs.Arguments) => {
                await handlers.edithandler(args).catch(
                    (e: any) => anyErrorYouLike("edit config", e),
                );
            },
        })
        .command({
            builder: (argv: yargs.Argv) => {
                return argv.positional('service', {
                    choices: ["crash", "relay", "fetcher"],
                    required: true,
                }).option("daemon", {
                    alias: "d",
                    default: false,
                    type: "boolean",
                });
            },
            command: "keep <service>",
            describe: "trigger services",
            handler: async (args: yargs.Arguments) => {
                await handlers.keepHandler(args).catch(
                    (e: any) => anyErrorYouLike("start service", e),
                );
            },
        })
        .command({
            builder: (argv: yargs.Argv) => argv.default("block", 0),
            command: "reset [block]",
            describe: "Reset genesis eth header in darwinia",
            handler: async (args: yargs.Arguments) => {
                await handlers.resetHandler(args).catch(
                    (e: any) => anyErrorYouLike("rest header", e),
                );
            },
        })
        .command({
            builder: (argv: yargs.Argv) => {
                return argv.positional("block", {
                    default: undefined,
                    describe: "block hash or block height"
                }).option("finalize", {
                    alias: "f",
                    default: false,
                    describe: "should wait for finalizing?",
                    type: "boolean",
                });
            },
            command: "relay [block]",
            describe: "Relay eth header to darwinia",
            handler: async (args: yargs.Arguments) => {
                await handlers.relayHandler(args).catch(
                    (e: any) => anyErrorYouLike("relay block", e),
                );
            },
        }).command({
            builder: {},
            command: "transfer <address> <amount>",
            describe: "Relay eth header to darwinia",
            handler: async (args: yargs.Arguments) => {
                await handlers.transferHandler(args).catch(
                    (e: any) => anyErrorYouLike("transfer", e),
                );
            },
        }).command({
            builder: {},
            command: "proof <number>",
            describe: "Get Proof for block",
            handler: async (args: yargs.Arguments) => {
                await handlers.proofHandler(args).catch(
                    (e: any) => anyErrorYouLike("proof", e),
                );
            },
        }).argv;

    // show help if no inputso
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
