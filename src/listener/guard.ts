import { ShadowAPI, API, ExResult } from "../api";
import { log } from "../util";

// Proposal guard
export async function listen(api: API, shadow: ShadowAPI) {
    let perms = 4;
    if ((await api._.query.sudo.key()).toJSON().indexOf(api.account.address) > -1) {
        perms = 7;
    } else if (((await api._.query.council.members()).toJSON() as string[]).indexOf(api.account.address) > -1) {
        perms = 5;
    } else {
        return;
    }

    // start listening
    const handled: number[] = [];
    setInterval(async () => {
        log.interval("Getting pending headers");
        const headers = (
            await api._.query.ethereumRelayerGame.pendingHeaders()
        ).toJSON() as string[][];
        if (headers.length === 0) {
            log("No pending headers need to be handled");
            return;
        }

        for (const h of headers) {
            const blockNumber = Number.parseInt(h[1], 10);
            if (handled.indexOf(blockNumber) > -1) {
                continue;
            }

            const block = (await shadow.getHeaderThing(blockNumber)) as any;
            if (
                JSON.stringify(block.header_thing) === JSON.stringify(h[2])
                && block.confirmation > 6
            ) {
                const res: ExResult = await api.approveBlock(blockNumber, perms);
                if (!res.isOk) {
                    log.err(res.toString())
                }
            } else {
                const res = await api.rejectBlock(h[1], perms);
                if (!res.isOk) {
                    log.err(res)
                    log.err(res.toString())
                }
            }
            handled.push(blockNumber);
        }
    }, 30000);
}
