#!/usr/bin/env node
import { whereisPj } from "@darwinia/util";
import yargs from "yargs";

import cmdBalance from "./src/balance";
// import cmdBlock from "./src/block";
import cmdCodec from "./src/codec";
import cmdConfig from "./src/config";
import cmdRelay from "./src/relay";
import cmdTransfer from "./src/transfer";
import cmdTx from "./src/tx";


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
          .command(cmdBalance)
          // .command(cmdBlock)
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
