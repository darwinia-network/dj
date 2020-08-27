import fs from "fs";
import yargs from "yargs";
import { whereisPj } from "../util";

import cmdBalance from "./balance";
import cmdCodec from "./codec";
import cmdConfig from "./config";
import cmdProposal from "./proposal";
// import cmdRelay from "./relay";
import cmdTransfer from "./transfer";
import cmdTx from "./tx";
import cmdGuard from "./guard";

// main
export default async function exec() {
    const pj = whereisPj();

    // Enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "INFO";
    }

    // parser
    const _ = yargs
        .usage("dj <hello...network>")
        .help("help").alias("help", "h")
          .version("version", pj.version).alias("version", "V")
          .command(cmdBalance)
          .command(cmdCodec)
          .command(cmdConfig)
          .command(cmdProposal)
          // .command(cmdRelay)
          .command(cmdTransfer)
          .command(cmdTx)
          .command(cmdGuard)
          .argv;

    // show help if no input
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
}
