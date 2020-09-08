import { autoAPI, ShadowAPI } from "../api";
import { ITx } from "../api/types";
import { log, Config } from "../util";
import * as Listener from "../listener"

const QUEUE: ITx[] = [];

// The proposal API
export async function run() {
    Listener.Cache.initCache();

    const conf = new Config();
    const api = await autoAPI();
    const shadow = new ShadowAPI(conf.shadow);

    // Start proposal linstener
    Listener.relay(api, shadow, QUEUE);
    Listener.ethereum(
        conf.ethereumListener,
        async (tx: string, ty: string, blockNumber: number) => {
            log.trace(`Find darwinia ${ty} tx ${tx} `);
            const lastConfirm = await api.lastConfirm();
            const relayedBlock = blockNumber + 1;
            await api.submitProposal([
                await shadow.getProposal([lastConfirm], relayedBlock, blockNumber),
            ]);

            QUEUE.push({ tx, ty, relayedBlock });
        }
    );
}
