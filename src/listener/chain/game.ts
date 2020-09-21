import { ShadowAPI, API } from "../../api";
import { log } from "../../util";
import { IEthereumHeaderThingWithProof } from "../../types";
import Cache from "../cache"

/// NewRound handler
export default async function game(
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
    const lastLeaf = Math.max(...(event.data[2].toJSON() as number[]));
    let members: number[] = event.data[2].toJSON() as number[];
    if (members === undefined) {
        return
    }

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

    const newProposal = await shadow.getProposal(newMember, newMember, lastLeaf);
    Cache.setBlock(Object.assign({
        ethash_proof: [],
        mmr_root: "",
        mmr_proof: [],
    }, JSON.parse(JSON.stringify(newProposal))));
    proposals = proposals.concat(newProposal);

    // Submit new proposals
    await api.submitProposal(proposals);

    // Loop through each of the parameters, displaying the type and data
    event.data.forEach((data: any, index: any) => {
        log.trace(`\t\t\t${types[index].type}: ${data.toString()}`);
    });
}
