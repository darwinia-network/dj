#!/usr/bin/env node
import { whereisPj } from "@darwinia/util";
import yargs from "yargs";

import cmdRecipe from "./src/recipe";
import cmdConfig from "./src/config";
import cmdRelay from "./src/relay";
import cmdTransfer from "./src/transfer";


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
          .command(cmdRelay)
          .command(cmdTransfer)
          .argv;

    // show help if no input
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
