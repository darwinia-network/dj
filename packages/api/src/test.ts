// import { Config } from "@darwinia/util";
import { ShadowAPI } from "./shadow";
import { autoAPI } from "./auto";

(async () => {
    // const cfg = new Config();
    const api = await autoAPI();
    const shadow = new ShadowAPI("http://localhost:3001/api/v1");
    const proposalHeaders: string[] = (
        await shadow.getProposal([1], 3)
    );

    // Subscribe to system events via storage
    api._.query.system.events((events) => {
        console.log(`\nReceived ${events.length} events:`);

        // Loop through the Vec<EventRecord>
        events.forEach((record) => {
            // Extract the phase, event and the event types
            const { event, phase } = record;
            const types = event.typeDef;

            // Show what we are busy with
            console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
            console.log(`\t\t${event.meta.documentation.toString()}`);

            // Loop through each of the parameters, displaying the type and data
            event.data.forEach((data, index) => {
                console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
            });
        });
    });

    await api.submit_proposal(proposalHeaders);
})();
