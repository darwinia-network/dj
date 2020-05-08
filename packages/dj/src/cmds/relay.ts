import yargs from "yargs";
import { autoAPI, ExResult, ShadowAPI } from "@darwinia/api";
import {
    Config, chalk, log,
} from "@darwinia/util";

const cmdRelay: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("block", {
            alias: "b",
            default: isNaN,
            type: "number",
            describe: "block hash or block height"
        }).option("finalize", {
            alias: "f",
            default: false,
            describe: "should wait for finalizing?",
            type: "boolean",
        });
    },
    command: "relay [block] [finalize]",
    describe: "Relay eth header to darwinia",
    handler: async (args: yargs.Arguments) => {
        const api = await autoAPI();
        const cfg = new Config();
        const shadow = new ShadowAPI(cfg.shadow);
        if (isNaN(args.block as number)) {
            const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
            const last = await shadow.getBlock(bestHeaderHash.toString());
            args.block = Number.parseInt((last.number as any), 16) + 1;
        }

        console.log(Number.parseInt(args.block as string, 10))
        const shadowResp = await shadow.getBlockWithProof(
            Number.parseInt(args.block as string, 10)
        );

        // Relay block to darwinia
        const res = await api.relay(
            shadowResp[0],
            shadowResp[1],
            (args.finalize as boolean),
        ).catch((e: ExResult) => {
            log.ex(e.toString());
        });

        // log and exit
        if ((res as ExResult).isOk) {
            log.ok(`relay header succeed 🎉 `);
            log.ox(chalk.cyan.underline(
                `https://crab.subscan.io/extrinsic/${(res as ExResult).exHash}`
            ));
        }

        log.ex("relay failed");
    },
}

export default cmdRelay;
