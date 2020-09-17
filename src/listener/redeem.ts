import { ShadowAPI, API } from "../api";
import { delay } from "../util";
import { ITx } from "../types";

/// Approved handler
export async function listen(
    api: API,
    shadow: ShadowAPI,
    queue: ITx[],
) {
    setInterval(async () => {
        const lastConfirmed = await api.lastConfirm();
        for (const tx of queue.filter((t) => t.blockNumber < lastConfirmed)) {
            await api.redeem(tx.ty, await shadow.getReceipt(tx.tx, lastConfirmed));
            await delay(10000);
        };
        queue = queue.filter((t) => t.blockNumber >= lastConfirmed);
    }, 30000);
}
