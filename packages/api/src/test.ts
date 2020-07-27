import { log } from "@darwinia/util";
import { ShadowAPI } from "./shadow";
import { autoAPI } from "./auto";

(async () => {
    const api = await autoAPI();
    const shadow = new ShadowAPI("http://localhost:3001/api/v1");
    const target: string[] = (await shadow.getProposal([19], 19));

    // Subscribe to system events via storage
    api._.query.system.events((events) => {
        // Loop through the Vec<EventRecord>
        events.forEach(async (record) => {
            // Extract the phase, event and the event types
            const { event, phase } = record;
            const types = event.typeDef;

            // Show what we are busy with
            if (event.method === "NewRound") {
                log.trace(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
                log.trace(`\t\t${event.meta.documentation.toString()}`);

                // Samples
                const lastLeaf = Math.max(...(event.data[1].toJSON() as number[]));
                const members = event.data[2].toJSON() as number[];
                await api.submit_proposal(await shadow.getProposal(members, lastLeaf));

                // Loop through each of the parameters, displaying the type and data
                event.data.forEach((data, index) => {
                    log.trace(`\t\t\t${types[index].type}: ${data.toString()}`);
                });
            }
        });
    });

    const r = await api.submit_proposal(target);
    console.log(r);
})();
