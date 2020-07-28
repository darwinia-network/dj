import yargs from "yargs";
import { autoAPI, ShadowAPI, API } from "@darwinia/api";
import { log, Config } from "@darwinia/util";
import path from "path";
import fs from "fs";

const cache = path.resolve((new Config()).path.root, "blocks");

// Init Cache
function initCache() {
    if (fs.existsSync(cache)) {
        fs.rmdirSync(cache);
    }

    fs.mkdirSync(cache, { recursive: true });
}

// Get block from cache
function getBlock(block: number): string {
    const f = path.resolve(cache, `${block}.block`);
    if (fs.existsSync(f)) {
        return fs.readFileSync(f).toString();
    } else {
        return "";
    }
}

// Get block from cache
function setBlock(block: number, codec: string) {
    fs.writeFileSync(path.resolve(cache, `${block}.block`), codec);
}

// Listen and submit proposals
function startListener(api: API, shadow: ShadowAPI) {
    // Subscribe to system events via storage
    api._.query.system.events((events) => {
        events.forEach(async (record) => {
            const { event, phase } = record;
            const types = event.typeDef;

            // Show what we are busy with
            if (event.method === "NewRound") {
                log.trace(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
                log.trace(`\t\t${event.meta.documentation.toString()}`);

                // Samples
                const lastLeaf = Math.max(...(event.data[1].toJSON() as number[]));
                const members: number[] = event.data[1].toJSON() as number[];
                const leftMembers: number[] = [];

                // Get proposals
                let proposals: string[] = [];
                members.forEach((i: number) => {
                    const block = getBlock(i);
                    if (block.length > 0) {
                        proposals.push(block);
                    } else {
                        leftMembers.push(i);
                    }
                })

                const newProposals = await shadow.getProposal(leftMembers, lastLeaf);
                newProposals.forEach((c: string, i: number) => setBlock(i, c));
                proposals = proposals.concat(newProposals);

                // Submit new proposals
                await api.submit_proposal(await shadow.getProposal(members, lastLeaf));

                // Loop through each of the parameters, displaying the type and data
                event.data.forEach((data, index) => {
                    log.trace(`\t\t\t${types[index].type}: ${data.toString()}`);
                });
            }
        });
    });
}

// The proposal API
async function handler(args: yargs.Arguments) {
    initCache();

    const conf = new Config();
    const api = await autoAPI();
    const shadow = new ShadowAPI(conf.shadow);
    const block = (args.block as number);

    // Start proposal linstener
    startListener(api, shadow);

    // The target block
    const target = await shadow.getProposal([block], block);
    log.trace(await api.submit_proposal(target));
}

const cmdProposal: yargs.CommandModule = {
    command: "proposal <block>",
    describe: "Submit a relay proposal to darwinia",
    handler,
}

export default cmdProposal;
