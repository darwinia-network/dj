import { ShadowAPI, API } from "../api";
import { log } from "../util";
import { DispatchError } from "@polkadot/types/interfaces/types";
import { IEthereumHeaderThingWithProof } from "../api/types";
import { Cache } from "./"

// Listen and submit proposals
export function proposal(api: API, shadow: ShadowAPI) {
    // Subscribe to system events via storage
    api._.query.system.events((events: any) => {
        events.forEach(async (record: any) => {
            const { event, phase } = record;
            const types = event.typeDef;

            if (event.method === "GameOver") {
                log.ok("Gameover");
            }

            if (event.method === "PendingHeaderApproved") {
                log.event(event.method);
                log.trace(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
                log.trace(`\t\t${event.meta.documentation.toString()}`);
            }

            // Show what we are busy with
            if (event.method === "NewRound") {
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

            if (event.data[0] && (event.data[0] as DispatchError).isModule) {
                log.err(api._.registry.findMetaError(
                    (event.data[0] as DispatchError).asModule.toU8a(),
                ));
            }
        });
    });
}
