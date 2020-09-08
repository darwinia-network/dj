import yargs from "yargs";
import { autoAPI, ShadowAPI, API, ExResult } from "../api";
import { log, Config } from "../util";
import path from "path";
import fs from "fs";
import { DispatchError } from "@polkadot/types/interfaces/types";
import { IEthereumHeaderThingWithProof } from "../api/types/block";


const cache = path.resolve((new Config()).path.root, "cache/blocks");

// Init Cache
function initCache() {
    if (fs.existsSync(cache)) {
        fs.rmdirSync(cache, { recursive: true });
    }

    fs.mkdirSync(cache, { recursive: true });
}

// Get block from cache
function getBlock(block: number): IEthereumHeaderThingWithProof | null {
    const f = path.resolve(cache, `${block}.block`);
    if (fs.existsSync(f)) {
        return JSON.parse(fs.readFileSync(f).toString());
    } else {
        return null;
    }
}

// Get block from cache
function setBlock(block: number, headerThing: IEthereumHeaderThingWithProof) {
    fs.writeFileSync(path.resolve(cache, `${block}.block`), JSON.stringify(headerThing));
}

// Proposal guard
async function guard(api: API, shadow: ShadowAPI) {
    let perms = 4;
    if ((await api._.query.sudo.key()).toJSON().indexOf(api.account.address) > -1) {
        perms = 7;
    } else if (((await api._.query.council.members()).toJSON() as string[]).indexOf(api.account.address) > -1) {
        perms = 5;
    } else {
        return;
    }

    // start listening
    let lock = false;
    const handled: number[] = [];
    setInterval(async () => {
        if (lock) { return; }
        const headers = (await api._.query.ethereumRelayerGame.pendingHeaders()).toJSON() as string[][];
        if (headers.length === 0) {
            return;
        }

        lock = true;
        for (const h of headers) {
            const blockNumber = Number.parseInt(h[1], 10);
            if (handled.indexOf(blockNumber) > -1) {
                break;
            }

            const headerThing = (await shadow.getHeaderThing(blockNumber)) as any;

            const hasEnoughConfirmations = headerThing.confirmations > 12;
            const isSame = JSON.stringify(headerThing.proof) === JSON.stringify(h[2]);
            if ( hasEnoughConfirmations && isSame) {
                const res: ExResult = await api.approveBlock(blockNumber, perms);
                if (res.isOk) {
                    log.event(`Approved block ${blockNumber}`)
                } else {
                    log.err(res.toString())
                }
            } else {
                const res = await api.rejectBlock(h[1], perms);
                if (res.isOk) {
                    log.event(`Rejected block ${blockNumber}`)
                } else {
                    log.err(res)
                    log.err(res.toString())
                }
            }
            handled.push(blockNumber);
        }

        lock = false;
    }, 10000);
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
                log.ok("Gameover");
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
                    const block = getBlock(i);
                    if (block) {
                        proposals.push(block);
                    } else {
                        newMember = i;
                    }
                })

                const newProposal = await shadow.getProposal([newMember], newMember, lastLeaf);
                setBlock(newMember, Object.assign(JSON.parse(JSON.stringify(newProposal)), {
                    ethash_proof: [],
                    mmr_root: "",
                    mmr_proof: [],
                }));
                proposals = proposals.concat(newProposal);

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

// The proposal API
async function handler(args: yargs.Arguments) {
    initCache();

    const conf = new Config();
    const api = await autoAPI();
    const block = (args.block as number);
    const lastConfirmedBlock = await api.lastConfirm();
    const shadow = new ShadowAPI(conf.shadow);

    // Start guard
    // conf.
    guard(api, shadow);

    // The target block
    const lastLeaf = block > 1 ? block - 1 : 0;
    const proposal = await shadow.getProposal(
        lastConfirmedBlock
            ? [lastConfirmedBlock]
            : [], block, lastLeaf
    );
    log.trace(await api.submitProposal([proposal]));

    // Start proposal linstener
    startListener(api, shadow);
    // addEventListener(conf.ethereumListener, console.log)
}

const cmdProposal: yargs.CommandModule = {
    command: "proposal <block>",
    describe: "Submit a relay proposal to darwinia",
    handler,
}

export default cmdProposal;
