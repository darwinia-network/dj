import yargs from "yargs";
import { autoAPI, ExResult, ShadowAPI } from "../api";
import { log, Config } from "../util";

export const cmdGuard: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => argv.options(
        "root", {
        alias: "r",
        type: "boolean",
        describte: "If use root origin",
    }),
    command: "guard",
    describe: "Set up an relayer game guard",
    handler: async (_: yargs.Arguments) => {
        const api = await autoAPI();
        const cfg = new Config();
        const shadow = new ShadowAPI(cfg.shadow);
        log.event("Relayer Game Guard has started");

        /// Blocks that handled
        const handled: number[] = [];
        setInterval(async () => {
            const headers = (await api._.query.relayerGame.pendingHeaders()).toJSON() as string[][];
            /// Could not  use `let h in headers` because a werid error
            for (const h of headers) {
                const blockNumber = Number.parseInt(h[1], 10);
                if (handled.indexOf(blockNumber) > -1) {
                    break;
                }

                const blockWithProof = (await shadow.getBlockWithProof(blockNumber, "codec")) as any;
                const block: string = blockWithProof[0] + blockWithProof[2];
                if (block === h[2]) {
                    const res: ExResult = await api.approveBlock(blockNumber, false);
                    if (res.isOk) {
                        log.event(`Approved block ${blockNumber}`)
                    } else {
                        log.err(res.toString())
                    }
                } else {
                    const res = await api.rejectBlock(h[1], true);
                    if (res.isOk) {
                        log.event(`Rejected block ${blockNumber}`)
                    } else {
                        log.err(res)
                        log.err(res.toString())
                    }
                }
                handled.push(blockNumber);
            }
        }, 10000);
    }
}

export default cmdGuard;
