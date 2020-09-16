import { ShadowAPI, API } from "../api";
import { log } from "../util";
import { ITx } from "../types";

// Listen and submit proposals
export function listen(api: API, shadow: ShadowAPI, queue: ITx[]) {
    setInterval(async () => {
        if (queue.length < 1) return;

        // Check last confirm
        const lastConfirmed = await api.lastConfirm();
        const maxBlock = queue.sort((p, q) => q.blockNumber - p.blockNumber)[0].blockNumber;
        if (lastConfirmed >= maxBlock + 1) {
            return;
        }

        // Submit new proposal
        const target = Math.max(lastConfirmed, maxBlock) + 1;
        if (!(await api.shouldRelay(target))) {
            return;
        };

        // Relay txs
        log(`Currently we have ${queue.length} txs are waiting to be redeemed`);
        await api.submitProposal([await shadow.getProposal(
            lastConfirmed,
            target,
            target - 1,
        )]).catch(log.err);
    }, 60000);
}
