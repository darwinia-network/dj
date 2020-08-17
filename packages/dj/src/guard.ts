import yargs from "yargs";
import { autoAPI, ShadowAPI, ExResult } from "@darwinia/api";
import { Config, log } from "@darwinia/util";

export const cmdGuard: yargs.CommandModule = {
    command: "guard",
    describe: "Set up an relayer game guard",
    handler: async (_: yargs.Arguments) => {
        log.event("Relayer Game Guard has been started");
        const api = await autoAPI();
        const cfg = new Config();
        const shadow = new ShadowAPI(cfg.shadow);

        /// Blocks that handled
        const handled: number[] = [];
        setInterval(async () => {
            let headers = (await api._.query.relayerGame.pendingHeaders()).toJSON() as string[][];

            /// Could not  use `let h in headers` because a werid error
            for (let h = 0; h < headers.length; h++) {
                const blockNumber = Number.parseInt(headers[h][1]);
                if (handled.indexOf(blockNumber) > -1) {
                    break;
                }

                const blockWithProof = (await shadow.getBlockWithProof(blockNumber, "codec")) as any;
                const block: string = blockWithProof[0] + blockWithProof[2];
                if (block === headers[h][2]) {
                    let res: ExResult = await api.approveBlock(blockNumber);
                    if (res.isOk) {
                        log.event(`Approved block ${blockNumber}`)
                    } else {
                        log.err(res.toString())
                    }
                } else {
                    let res = await api.rejectBlock(headers[h][1]);
                    if (res.isOk) {
                        log.event(`Rejected block ${blockNumber}`)
                    } else {
                        log.err(res.toString())
                    }
                }
                handled.push(blockNumber);
            }
        }, 10000);
    }
}

export default cmdGuard;
