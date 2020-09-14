import { ShadowAPI, API } from "../../api";
import { log, delay } from "../../util";
import { ITx } from "../../types";

/// Approved handler
export default async function approved(
    event: any,
    phase: any,
    api: API,
    shadow: ShadowAPI,
    queue: ITx[],
) {
    log.trace(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
    log.trace(`\t\t${event.meta.documentation.toString()}`);

    for (const tx of queue) {
        const curLastConfirmed = await api.lastConfirm();
        await api.redeem(tx.ty, await shadow.getReceipt(tx.tx, curLastConfirmed));
        await delay(10000);
    };
}
