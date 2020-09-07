import { ShadowAPI, API, ExResult } from "../api";
import { log } from "../util";

// Proposal guard
export async function guard(api: API, shadow: ShadowAPI) {
    let perms = 4;
    if ((await api._.query.sudo.key()).toJSON().indexOf(api.account.address) > -1) {
        perms = 7;
    } else if (((await api._.query.council.members()).toJSON() as string[]).indexOf(api.account.address) > -1) {
        perms = 5;
    } else {
        return;
    }

    // start listening
    let lock = false;
    const handled: number[] = [];
    setInterval(async () => {
        if (lock) { return; }
        const headers = (await api._.query.ethereumRelayerGame.pendingHeaders()).toJSON() as string[][];
        if (headers.length === 0) {
            return;
        }

        lock = true;
        for (const h of headers) {
            const blockNumber = Number.parseInt(h[1], 10);
            if (handled.indexOf(blockNumber) > -1) {
                break;
            }

            const block = (await shadow.getHeaderThing(blockNumber)) as any;
            if (JSON.stringify(block) === JSON.stringify(h[2])) {
                const res: ExResult = await api.approveBlock(blockNumber, perms);
                if (res.isOk) {
                    log.event(`Approved block ${blockNumber}`)
                } else {
                    log.err(res.toString())
                }
            } else {
                const res = await api.rejectBlock(h[1], perms);
                if (res.isOk) {
                    log.event(`Rejected block ${blockNumber}`)
                } else {
                    log.err(res)
                    log.err(res.toString())
                }
            }
            handled.push(blockNumber);
        }

        lock = false;
    }, 10000);
}
