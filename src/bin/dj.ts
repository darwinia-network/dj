#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import yargs from "yargs";

import { log } from "../log";
import { autoAPI } from "../utils";

// main
(async () => {
    const pj: Record<string, any> = JSON.parse(fs.readFileSync(
        path.resolve(__dirname, "../../package.json"), "utf8",
    ));

    // parser
    yargs
        .usage("darwinia.js <hello@darwinia.network>")
        .help("help").alias("help", "h")
        .version("version", pj.version).alias("version", "V")
        .command("getBalance", "get balance of darwinia account", async (yargs: yargs.Argv) => {
            yargs.positional("address", {
                default: "",
                describe: [
                    "address of darwinia account, if empty, will ",
                    "get balance of your account in `~/.darwinia/dj.json`",
                ].join(""),
            });
        }, async (argv: yargs.Arguments) => {
            const api = await autoAPI();
            let addr = (argv.address as string);
            if (addr === "") {
                addr = api.account.address;
            }

            const balance = await api.getBalance(addr);
            log.ox(balance + " RING 💰");
            process.exit(0);
        }).argv;

    // show help if no inputs
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
