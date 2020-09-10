import yargs from "yargs";
import { whereisPj } from "../util";

import cmdConfig from "./config";
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
        .command(cmdConfig)
        .argv;

    // show help if no input
    if (process.argv.length < 3) {
        run();
    }
}
