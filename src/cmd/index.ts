import yargs from "yargs";
import { whereisPj } from "../util";

import cmdBalance from "./balance";
import cmdConfig from "./config";
import cmdTransfer from "./transfer";
import { run } from "./run";

// main
export default async function exec() {
    const pj = whereisPj();

    // Enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "INFO";
    }

    // parser
    const _ = yargs
        .usage("dj <hello@darwinia.network>")
        .help("help").alias("help", "h")
        .version("version", pj.version).alias("version", "V")
        .command(cmdBalance)
        .command(cmdConfig)
        .command(cmdTransfer)
        .argv;

    // show help if no input
    if (process.argv.length < 3) {
        run();
    }
}
