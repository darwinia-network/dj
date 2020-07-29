import { log } from "@darwinia/util";
import { autoAPI } from "./auto";
import { headers } from "./0.json";
import { DispatchError } from "@polkadot/types/interfaces/types";

// Starts from block uncle 19
export async function uncle_proposal() {
    // const cfg = new Config();
    const api = await autoAPI();
    await api.submit_proposal([headers[19]]);

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
                log.trace(`new proposal: ${event.data[1].toJSON() as number[]}`);

                /// # MOCK
                ///
                /// Map the mock headers
                const members = (event.data[1].toJSON() as number[]).map((i: number) => headers[i]);
                setTimeout(async () => await api.submit_proposal(members), 5000);

                // Loop through each of the parameters, displaying the type and data
                event.data.forEach((data, index) => {
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
