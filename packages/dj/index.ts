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
    log.err(e);
    log.ex(`${cms} failed`);
}

// main
(async () => {
    // enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "INFO";
    }

    // parser
    const _ = yargs
        .usage("dj <hello@darwinia.network>")
        .help("help").alias("help", "h")
        .version("version", whereisPj().version).alias("version", "V")
        .command({
            builder: (argv: yargs.Argv) => {
                return argv.positional("recipe", {
                    alias: "r",
                    choices: ["balance", "bestHeader", "header", "codec"],
                    default: "balance",
                    describe: "the target recipe",
                    required: true,
                    type: "string",
                }).positional("address", {
                    alias: "a",
                    default: "",
                    describe: "target address",
                    type: "string",
                }).positional("block", {
                    alias: "b",
                    default: "",
                    describe: "get block info",
                    type: "string",
                });
            },
            command: "info <recipe>",
            describe: "Get info of some recipes",
            handler: async (args: yargs.Arguments) => {
                await handlers.infoHandler(args).catch(
                    (e: any) => anyErrorYouLike("get info", e),
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
                    choices: ["grammer", "relay"],
                    required: true,
                }).option("daemon", {
                    alias: "d",
                    default: false,
                    type: "boolean",
                }).option("port", {
                    alias: "p",
                    default: null,
                    type: "number",
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
        }).argv;

    // show help if no input
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
