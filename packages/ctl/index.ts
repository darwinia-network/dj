#!/usr/bin/env node
import child_process from "child_process";
import yargs from "yargs";
import { Config, log, whereisPj } from "@darwinia/util";
import Crash from "./src/crash";
import Fetcher from "./src/fetcher";
import Relay from "./src/relay";
import Service from "./src/service";

async function forever(s: Service) {
    await s.start().catch((e) => {
        log.err(e.toString());
        setTimeout(async () => {
            await forever(s);
        }, 3000);
    })
}

// main
(async () => {
    // enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "ALL";
    }

    // parser
    const _ = yargs
        .usage("dactle <hello@darwinia.network>")
        .help("help").alias("help", "h")
        .version("version", whereisPj().version).alias("version", "V")
        .command({
            builder: (argv: yargs.Argv) => argv.default("edit", false),
            command: "config [edit]",
            describe: "show config",
            handler: (args: yargs.Arguments) => {
                const cfg = new Config();
                if ((args.edit as boolean)) {
                    child_process.spawnSync("vi", [cfg.path.conf], {
                        stdio: "inherit",
                    });
                } else {
                    log.n(JSON.parse(cfg.toString()));
                }
            },
        })
        .command({
            builder: {},
            command: "crash",
            describe: "keep sending tx to ethereum and save the container blocks",
            handler: async () => {
                const s = await Crash.new();
                await forever(s);
            },
        })
        .command({
            builder: (argv: yargs.Argv) => argv.default("block", 0),
            command: "fetcher",
            describe: "keep fetching eth blocks to local storage",
            handler: async () => {
                const s = await Fetcher.new();
                await forever(s);
            },
        })
        .command({
            builder: (argv: yargs.Argv) => argv.default("block", 1),
            command: "relay",
            describe: "keep relaying eth headers to darwinia",
            handler: async () => {
                const s = await Relay.new();
                await forever(s);
            },
        }).argv;

    // show help if no inputs
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
