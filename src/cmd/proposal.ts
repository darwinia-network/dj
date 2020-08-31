import yargs from "yargs";
import { autoAPI, ShadowAPI, API } from "../api";
import { log, Config } from "../util";
import path from "path";
import fs from "fs";
import { DispatchError } from "@polkadot/types/interfaces/types";
import { IEthHeaderThing } from "../api/types/block";

const cache = path.resolve((new Config()).path.root, "cache/blocks");

// Init Cache
function initCache() {
    if (fs.existsSync(cache)) {
        fs.rmdirSync(cache, { recursive: true });
    }

    fs.mkdirSync(cache, { recursive: true });
}

// Get block from cache
function getBlock(block: number): IEthHeaderThing | null {
    const f = path.resolve(cache, `${block}.block`);
    if (fs.existsSync(f)) {
        return JSON.parse(fs.readFileSync(f).toString());
    } else {
        return null;
    }
}

// Get block from cache
function setBlock(block: number, headerThing: IEthHeaderThing) {
    fs.writeFileSync(path.resolve(cache, `${block}.block`), JSON.stringify(headerThing));
}

/// block 19: Uncle
/// diff:
///   block
///   ethash_proof
///   mmr_root
///   mmr_proof
///
/// block 1-18: Normal ----- [19, 18]
/// diff:
///    mmr_proof

/// chain-0       chain-1
/// ---------------------------
/// real [19]      mock [19]
/// real [19,18]   mock [19,18]

// Listen and submit proposals
function startListener(api: API, shadow: ShadowAPI) {
    // Subscribe to system events via storage
    api._.query.system.events((events) => {
        events.forEach(async (record) => {
            const { event, phase } = record;
            const types = event.typeDef;

            if (event.method === "GameOver") {
                log.ox("A new proposal has been submitted");
            }

            // Show what we are busy with
            if (event.method === "NewRound") {
                log.trace(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
                log.trace(`\t\t${event.meta.documentation.toString()}`);

                // Samples
                const lastLeaf = Math.max(...(event.data[1].toJSON() as number[]));
                const members: number[] = event.data[1].toJSON() as number[];
                const leftMembers: number[] = [];

                // Get proposals
                let proposals: IEthHeaderThing[] = [];
                members.forEach((i: number) => {
                    const block = getBlock(i);
                    if (block) {
                        proposals.push(block);
                    } else {
                        leftMembers.push(i);
                    }
                })

                const newProposals = await shadow.getProposal(leftMembers, lastLeaf);
                newProposals.forEach((c: IEthHeaderThing, i: number) => setBlock(i, c));
                proposals = proposals.concat(newProposals);

                // Submit new proposals
                await api.submitProposal(proposals);

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

/// proposal a block
export async function proposal(block: number) {
    initCache();

    const conf = new Config();
    const api = await autoAPI();
    const shadow = new ShadowAPI(conf.shadow);

    // Start proposal linstener
    startListener(api, shadow);

    // The target block
    const target = await shadow.getProposal([block], block);
    log.trace(await api.submitProposal(target));
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
    log.trace(await api.submitProposal(target));
}

const cmdProposal: yargs.CommandModule = {
    command: "proposal <block>",
    describe: "Submit a relay proposal to darwinia",
    handler,
}

export default cmdProposal;
