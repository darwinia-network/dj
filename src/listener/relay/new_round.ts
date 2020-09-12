import { ShadowAPI, API } from "../../api";
import { log } from "../../util";
import { IEthereumHeaderThingWithProof } from "../../types";
import { Cache } from "../"

/// NewRound handler
export default async function newRound(
    event: any,
    phase: any,
    types: any,
    api: API,
    shadow: ShadowAPI,
) {
    log.trace(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
    log.trace(`\t\t${event.meta.documentation.toString()}`);
    log.trace(JSON.stringify(event.data.toJSON()));

    // Samples
    const lastLeaf = Math.max(...(event.data[0].toJSON() as number[]));
    let members: number[] | number = event.data[0].toJSON() as number[];
    if (members === undefined) {
        return
    } else if (!Array.isArray(members)) {
        members = [members as number];
    }

    // Get proposals
    let newMember: number = 0;
    let proposals: IEthereumHeaderThingWithProof[] = [];
    (members as number[]).forEach((i: number) => {
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
