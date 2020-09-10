import { ShadowAPI, API } from "../api";
import { log, delay } from "../util";
import { DispatchError } from "@polkadot/types/interfaces/types";
import { IEthereumHeaderThingWithProof, ITx } from "../types";
import { Cache } from "./"

// Listen and submit proposals
export function relay(api: API, shadow: ShadowAPI, queue: ITx[]) {
    let lastConfirmed: number = 0;

    // Trigger relay every 180s
    setInterval(async () => {
        if (queue.length < 1) return;
        lastConfirmed = await api.lastConfirm();
        log(`Currently we have ${queue.length} txs are waiting to be redeemed`);
        api.submitProposal([await shadow.getProposal(
            [lastConfirmed],
            lastConfirmed,
            lastConfirmed - 1,
        )])
    }, 180000);

    // Subscribe to system events via storage
    api._.query.system.events((events: any) => {
        events.forEach(async (record: any) => {
            const { event, phase } = record;
            const types = event.typeDef;

            lastConfirmed = await api.lastConfirm();
            switch (event.method) {
                case "GameOver":
                    gameOver();
                case "PendingHeaderApproved":
                    approved(event, phase, api, shadow, queue, lastConfirmed);
                case "NewRound":
                    await newRound(event, phase, types, api, shadow);
            }

            if (event.data[0] && (event.data[0] as DispatchError).isModule) {
                log.err(api._.registry.findMetaError(
                    (event.data[0] as DispatchError).asModule.toU8a(),
                ));
            }
        });
    });
}

/// GameOver handler
function gameOver() {
    log.trace("Gameover");
}

/// Approved handler
function approved(
    event: any,
    phase: any,
    api: API,
    shadow: ShadowAPI,
    queue: ITx[],
    lastConfirmed: number,
) {
    log.trace(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
    log.trace(`\t\t${event.meta.documentation.toString()}`);
    queue.filter((tx) => tx.blockNumber < lastConfirmed).forEach(async (tx) => {
        await delay(50000);
        lastConfirmed = await api.lastConfirm();
        await api.redeem(tx.ty, await shadow.getReceipt(tx.tx, lastConfirmed));
    });

    queue = queue.filter((tx) => tx.blockNumber > lastConfirmed);
}

/// NewRound handler
async function newRound(
    event: any,
    phase: any,
    types: any,
    api: API,
    shadow: ShadowAPI,
) {
    log.trace(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
    log.trace(`\t\t${event.meta.documentation.toString()}`);

    // Samples
    const lastLeaf = Math.max(...(event.data[1].toJSON() as number[]));
    const members: number[] = event.data[1].toJSON() as number[];

    // Get proposals
    let newMember: number = 0;
    let proposals: IEthereumHeaderThingWithProof[] = [];
    members.forEach((i: number) => {
        const block = Cache.getBlock(i);
        if (block) {
            proposals.push(block);
        } else {
            newMember = i;
        }
    })

    const newProposal = await shadow.getProposal([newMember], newMember, lastLeaf);
    Cache.setBlock(newMember, Object.assign(JSON.parse(JSON.stringify(newProposal)), {
        ethash_proof: [],
        mmr_root: "",
        mmr_proof: [],
    }));
    proposals = proposals.concat(newProposal);

    // Submit new proposals
    await api.submitProposal(proposals);

    // Loop through each of the parameters, displaying the type and data
    event.data.forEach((data: any, index: any) => {
        log.trace(`\t\t\t${types[index].type}: ${data.toString()}`);
    });
}
