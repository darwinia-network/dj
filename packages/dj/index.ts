#!/usr/bin/env node
import fs from "fs";
import yargs from "yargs";
import { whereisPj } from "@darwinia/util";

import cmdBalance from "./src/balance";
import cmdCodec from "./src/codec";
import cmdConfig from "./src/config";
import cmdProposal from "./src/proposal";
import cmdRelay from "./src/relay";
import cmdTransfer from "./src/transfer";
import cmdTx from "./src/tx";

// main
(async () => {
    const pj = whereisPj();

    // enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "INFO";
    }

    // parser
    const _ = yargs
        .usage("dj <hello@darwinia.network>")
        .help("help").alias("help", "h")
          .version("version", "0.1.39-alpha.2").alias("version", "V")
          .command(cmdBalance)
          .command(cmdCodec)
          .command(cmdConfig)
          .command(cmdProposal)
          .command(cmdRelay)
          .command(cmdTransfer)
          .command(cmdTx)
          .argv;

    // show help if no input
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
