import { ShadowAPI, API } from "../api";
import { delay, log } from "../util";
import Cache from "./cache";

/// Approved handler
export async function listen(
    api: API,
    shadow: ShadowAPI,
) {
    setInterval(async () => {
        log.interval("Check if there is any tx wating to be redeemed");
        const lastConfirmed = await api.lastConfirm();
        for (const tx of Cache.trimTxs(lastConfirmed)) {
            if (!(await api.isRedeemAble(tx))) {
                continue;
            }
            await api.redeem(tx.ty, await shadow.getReceipt(tx.tx, lastConfirmed));
            await delay(10000);
        };
    }, 30000);
}
