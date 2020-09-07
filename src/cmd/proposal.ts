import yargs from "yargs";
import { autoAPI, ShadowAPI } from "../api";
import { log, Config } from "../util";
import * as Listener from "../listener"

// The proposal API
async function handler(args: yargs.Arguments) {
    Listener.Cache.initCache();

    const conf = new Config();
    const api = await autoAPI();
    const block = (args.block as number);
    const lastConfirmedBlock: number | null = await api.lastConfirm();
    const shadow = new ShadowAPI(conf.shadow);

    // Start guard
    // conf.
    Listener.guard(api, shadow);

    // The target block
    const lastLeaf = block > 1 ? block - 1 : 0;
    const proposal = await shadow.getProposal([lastConfirmedBlock], block, lastLeaf);
    log.trace(await api.submitProposal([proposal]));

    // Start proposal linstener
    Listener.proposal(api, shadow);
}

const cmdProposal: yargs.CommandModule = {
    command: "proposal <block>",
    describe: "Submit a relay proposal to darwinia",
    handler,
}

export default cmdProposal;
