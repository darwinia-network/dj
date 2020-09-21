import { ShadowAPI, API } from "../api";
import { delay } from "../util";
import Cache from "./cache";

/// Approved handler
export async function listen(
    api: API,
    shadow: ShadowAPI,
) {
    setInterval(async () => {
        const lastConfirmed = await api.lastConfirm();
        for (const tx of Cache.trimTxs(lastConfirmed)) {
            await api.redeem(tx.ty, await shadow.getReceipt(tx.tx, lastConfirmed));
            await delay(10000);
        };
    }, 30000);
}
