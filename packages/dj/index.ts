#!/usr/bin/env node
import { autoAPI, autoWeb3, ExResult } from "@darwinia/api";
import { Config, chalk, IDarwiniaEthBlock, log, whereisPj, TYPES_URL } from "@darwinia/util";
import { execSync } from "child_process";
import yargs from "yargs";
import Crash from "./src/crash";
import Fetcher from "./src/fetcher";
import Relay from "./src/relay";


// main
(async () => {
    // enable logger
    if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "ALL";
    }

    // parser
    const _ = yargs
        .usage("dj <hello@darwinia.network>")
        .help("help").alias("help", "h")
        .version("version", whereisPj().version).alias("version", "V")
        .command({
            builder: (argv: yargs.Argv) => argv.default("address", ""),
            command: "balance [address]",
            describe: "Get balance of darwinia account",
            handler: async (args: yargs.Arguments) => {
                const api = await autoAPI();
                let addr = (args.address as string);
                if (addr === "") {
                    addr = api.account.address;
                }

                const balance = await api.getBalance(addr).catch((e: any) => {
                    log.err(e);
                    log.ex("get balance failed");
                });

                log.ox(balance + " RING 💰");
            },
        })
        .command({
            builder: (argv: yargs.Argv) => {
                return argv.positional("edit", {
                    alias: "e",
                    describe: "edit the config of darwinia.js",
                    default: false,
                    type: "boolean",
                }).positional("update", {
                    alias: "u",
                    describe: "update the types.json of darwinia.js",
                    default: false,
                    type: "boolean",
                });
            },
            command: "config [edit]",
            describe: "show config",
            handler: async (args: yargs.Arguments) => {
                const cfg = new Config();

                if ((args.edit as boolean)) {
                    cfg.edit();
                } else if ((args.update as boolean)) {
                    await cfg.updateTypes().catch((e: any) => {
                        log.err("network connection fail, please check your network: ");
                        log(`you can download types.json from ${chalk.cyan.underline()}`);
                    });
                } else {
                    log.n(JSON.parse(cfg.toString()));
                }
            },
        })
        .command({
            builder: (argv: yargs.Argv) => {
                return argv.positional('service', {
                    choices: ["crash", "relay", "fetcher"],
                    required: true,
                }).option("daemon", {
                    alias: "d",
                    default: false,
                    type: "boolean",
                });
            },
            command: "keep <service>",
            describe: "trigger services",
            handler: async (args: yargs.Arguments) => {
                if ((args.daemon as boolean)) {
                    execSync(`pm2 start dj -- keep ${args.service}`);
                } else {
                    switch ((args.service as string)) {
                        case "crash":
                            const crash = await Crash.new();
                            await crash.forever();
                        case "crash":
                            const fetcher = await Fetcher.new();
                            await fetcher.forever();
                        case "relay":
                            const relay = await Relay.new();
                            await relay.forever();
                        default:
                            break;
                    }
                }
            },
        })
        .command({
            builder: (argv: yargs.Argv) => argv.default("block", 0),
            command: "reset [block]",
            describe: "Reset genesis eth header in darwinia",
            handler: async (args: yargs.Arguments) => {
                const api = await autoAPI();
                const web3 = await autoWeb3();
                const block = await web3.getBlock((args.block as string));
                log.trace(JSON.stringify(block, null, 2));

                const res = await api.reset(block).catch((e: ExResult) => {
                    log.ex(e.toString());
                });

                log.ox(`reset header succeed 📦 - ${(res as ExResult).toString()}`);
            },
        })
        .command({
            builder: (argv: yargs.Argv) => {
                return argv.positional("block", {
                    default: undefined,
                    describe: "block hash or block height"
                }).option("finalize", {
                    alias: "f",
                    default: false,
                    describe: "should wait for finalizing?",
                    type: "boolean",
                });
            },
            command: "relay [block]",
            describe: "Relay eth header to darwinia",
            handler: async (args: yargs.Arguments) => {
                const api = await autoAPI();
                const web3 = await autoWeb3();
                if (!args.block) {
                    const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
                    const last = await web3.getBlock(bestHeaderHash.toString());
                    args.block = (last.number as number) + 1;
                }

                const block = await web3.getBlock((args.block as number));
                const res = await api.relay(
                    (block as IDarwiniaEthBlock), (args.finalize as boolean),
                ).catch((e: ExResult) => {
                    log.ex(e.toString());
                });

                if (args.finalize) {
                    log.ox(`relay header succeed 🎉 - ${(res as ExResult).toString()}`);
                } else {
                    log.ok(`the tx is contained in block ${(res as ExResult).blockHash}`);
                    log.ox(chalk.cyan.underline(`https://crab.subscan.io/extrinsic/${(res as ExResult).exHash}`));
                }
            },
        }).command({
            builder: {},
            command: "transfer <address> <amount>",
            describe: "Relay eth header to darwinia",
            handler: async (args: yargs.Arguments) => {
                const api = await autoAPI();
                const res = await api.transfer(
                    (args.address as string),
                    (args.amount as number),
                ).catch((e: ExResult) => {
                    log.ex(e.toString());
                });

                log.ox("transfer succeed 💰 - " + (res as ExResult).toString());
            },
        }).argv;

    // show help if no inputs
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
