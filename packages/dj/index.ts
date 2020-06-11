#!/usr/bin/env node
import fs from "fs";
import yargs from "yargs";
import { whereisPj } from "@darwinia/util";

import cmdBalance from "./src/balance";
import cmdCodec from "./src/codec";
import cmdConfig from "./src/config";
import cmdRelay from "./src/relay";
import cmdTransfer from "./src/transfer";
import cmdTx from "./src/tx";

// main
(async () => {
    const pj = JSON.parse(fs.readFileSync("./package.json").toString());

    // enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "INFO";
    }

    // parser
    const _ = yargs
        .usage("dj <hello@darwinia.network>")
        .help("help").alias("help", "h")
          .version("version", pj.version).alias("version", "V")
          .command(cmdBalance)
          .command(cmdCodec)
          .command(cmdConfig)
          .command(cmdRelay)
          .command(cmdTransfer)
          .command(cmdTx)
          .argv;

    // show help if no input
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
