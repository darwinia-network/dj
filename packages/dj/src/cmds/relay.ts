import yargs from "yargs";
import { autoAPI, ExResult, ShadowAPI } from "@darwinia/api";
import {
    Config, chalk, log,
} from "@darwinia/util";

const cmdRelay: yargs.CommandModule = {
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
        const cfg = new Config();
        const shadow = new ShadowAPI(cfg.shadow);
        if (!args.block) {
            const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
            const last = await shadow.getBlock(bestHeaderHash.toString());
            args.block = last.number + 1;
        }

        const shadowResp = await shadow.getBlockWithProof(args.block as number);
        const res = await api.relay(
            shadowResp[0],
            shadowResp[1],
            (args.finalize as boolean),
        ).catch((e: ExResult) => {
            log.ex(e.toString());
        });

        if (args.finalize) {
            log.ox(`relay header succeed 🎉 - ${(res as ExResult).toString()}`);
        } else {
            log.ok(`the tx is contained in block ${(res as ExResult).blockHash}`);
            log.ox(chalk.cyan.underline(
                `https://crab.subscan.io/extrinsic/${(res as ExResult).exHash}`
            ));
        }
    },
}

export default cmdRelay;
