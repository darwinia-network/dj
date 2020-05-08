#!/usr/bin/env node
import { whereisPj } from "@darwinia/util";
import yargs from "yargs";

import cmdRecipe from "./recipe";
import cmdConfig from "./config";
import cmdKeep from "./keep";
import cmdRelay from "./relay";
import cmdTransfer from "./transfer";


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
          .command(cmdRecipe)
          .command(cmdConfig)
          .command(cmdKeep)
          .command(cmdRelay)
          .command(cmdTransfer)
          .argv;

    // show help if no input
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
