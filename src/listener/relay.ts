import { ShadowAPI, API } from "../api";
import { log } from "../util";
import Cache from "./cache";

// Listen and submit proposals
export function listen(api: API, shadow: ShadowAPI) {
    setInterval(async () => {
        if (Cache.txs.length < 1) return;

        // Check last confirm
        const lastConfirmed = await api.lastConfirm();
        const maxBlock = Cache.supTx(lastConfirmed);
        if (lastConfirmed >= maxBlock + 1) {
            return;
        }

        // Submit new proposal
        const target = Math.max(lastConfirmed, maxBlock) + 1;
        if (!(await api.shouldRelay(target))) {
            return;
        };

        // Relay txs
        log(`Currently we have ${Cache.txs.length} txs are waiting to be redeemed`);
        await api.submitProposal([await shadow.getProposal(
            lastConfirmed,
            target,
            target - 1,
        )]).catch(log.err);
    }, 60000);
}
