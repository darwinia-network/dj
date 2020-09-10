import { autoAPI, ShadowAPI } from "../api";
import { ITx } from "../types";
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
    Listener.guard(api, shadow);
    Listener.relay(api, shadow, QUEUE);
    Listener.ethereum(
        conf.eth,
        async (tx: string, ty: string, blockNumber: number) => {
            log.trace(`Find darwinia ${ty} tx ${tx} in block ${blockNumber}`);
            QUEUE.push({ blockNumber, tx, ty: ty === "bank" ? "Deposit" : "Token" });
        }
    );
}
