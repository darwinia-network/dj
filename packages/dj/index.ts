#!/usr/bin/env node
import child_process from "child_process";
import { autoAPI, autoWeb3, ExResult } from "@darwinia/api";
import { Config, log, whereisPj } from "@darwinia/util";
import yargs from "yargs";


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
            builder: (argv: yargs.Argv) => argv.default("edit", false),
            command: "config [edit]",
            describe: "show config",
            handler: (args: yargs.Arguments) => {
                const cfg = new Config();

                if ((args.edit as boolean)) {
                    child_process.spawnSync("vi", [cfg.path.conf], {
                        stdio: "inherit",
                    });
                } else {
                    log.n(JSON.parse(cfg.toString()));
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
            builder: (argv: yargs.Argv) => argv.default("block", 1),
            command: "relay [block]",
            describe: "Relay eth header to darwinia",
            handler: async (args: yargs.Arguments) => {
                const api = await autoAPI();
                const web3 = await autoWeb3();
                const block = await web3.getBlock((args.block as string));
                log.trace(JSON.stringify(block, null, 2));

                const res = await api.relay(block).catch((e: ExResult) => {
                    log.ex(e.toString());
                });

                log.ox(`relay header succeed 🎉 - ${(res as ExResult).toString()}`);
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

                log.ox(`transfer succeed 💰 - ${(res as ExResult).toString()}`);
            },
        }).argv;

    // show help if no inputs
    if (process.argv.length < 3) {
        yargs.showHelp();
    }
})();
