#!/usr/bin/env node
import fs from "fs";
import yargs from "yargs";
import cmdBot from "./src/bot";
import { whereisPj } from "@darwinia/util";

// main
(async () => {
    const pj = whereisPj();

    // enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "INFO";
    }

    // parser
    const _ = yargs
          .usage("dactle <hello@darwinia.network>")
          .help("help").alias("help", "h")
          .version("version", pj.version).alias("version", "V")
          .command(cmdBot)
          .argv;

    // show help if no input
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
