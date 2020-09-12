import { ShadowAPI, API } from "../../api";
import { log } from "../../util";
import { ITx } from "../../types";



// Listen and submit proposals
export default function relay(api: API, shadow: ShadowAPI, queue: ITx[]) {
    const submitted: number[] = [];

    // Trigger relay every 180s
    setInterval(async () => {
        if (queue.length < 1) return;

        // Check last confirm
        const lastConfirmed = await api.lastConfirm();
        let target = Math.max(
            lastConfirmed + 1,
            queue.sort((p, q) => q.blockNumber - p.blockNumber)[0].blockNumber,
        );

        // Check target
        while (submitted.indexOf(target) > -1) {
            target += 1;
        }

        // Submit new proposal
        log(`Currently we have ${queue.length} txs are waiting to be redeemed`);
        await api.submitProposal([await shadow.getProposal(
            lastConfirmed,
            target,
            target - 1,
        )]).catch(log.err);

        // Refresh target
        submitted.push(target);
    }, 180000);
}
