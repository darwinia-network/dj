import { autoAPI, ShadowAPI } from "../api";
import { ITx } from "../api/types";
import { Config } from "../util";
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
            const lastConfirm = await api.lastConfirm();
            QUEUE.push({
                tx,
                ty,
                blockNumber,
                proof: await shadow.getReceipt(tx, lastConfirm),
            });
        }
    );
}
