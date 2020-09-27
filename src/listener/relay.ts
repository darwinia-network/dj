import { ShadowAPI, API } from "../api";
import { log } from "../util";
import Cache from "../cache";

// Listen and submit proposals
export function listen(api: API, shadow: ShadowAPI) {
    setInterval(async () => {
        log.interval("Check if dj needs to relay a new block");
        if (Cache.txs.length < 1) {
            log("No txs are waiting to be redeemed");
            return;
        }

        // Check last confirm
        const lastConfirmed = await api.lastConfirm();
        const maxBlock = Cache.supTx();
        log(`Current maxBlock in tx pool is ${maxBlock}, lastConfirmed in darwinia is ${lastConfirmed}`);
        if (lastConfirmed >= maxBlock + 1) {
            return;
        }

        // Submit new proposal
        log(`Currently we have ${Cache.txs.length} txs are waiting to be redeemed`);
        const target = Math.max(lastConfirmed, maxBlock) + 1;
        if (!(await api.shouldRelay(target))) {
            return;
        };

        // Relay txs
        await api.submitProposal([await shadow.getProposal(
            lastConfirmed,
            target,
            target - 1,
        )]).catch(log.err);
    }, 60000);
}
