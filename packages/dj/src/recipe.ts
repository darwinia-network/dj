import yargs from "yargs";
import { autoAPI, API, ShadowAPI } from "@darwinia/api";
import { Vec, Struct } from "@polkadot/types";
import { Config, IDarwiniaEthBlock, log } from "@darwinia/util";

/**
 * Helpers
 */
async function recipeBalance(api: API, args: yargs.Arguments) {
    let addr = (args.address as string);
    if (addr === "") {
        addr = api.account.address;
    }

    const balance = await api.getBalance(addr);
    const s = balance + " RING 💰";
    log.ox(s);
}

async function recipeBestHeader(api: API, shadow: ShadowAPI) {
    const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
    const last = await shadow.getBlock(bestHeaderHash.toString());
    log.ox(JSON.stringify(last, null, 2));
}

async function recipeHeader(api: API, args: yargs.Arguments, shadow: ShadowAPI) {
    const block = (args.block as string);
    let header: IDarwiniaEthBlock | null = null;
    if (block === "") {
        const hash = await api._.query.ethRelay.bestHeaderHash();
        header = await shadow.getBlock(hash.toString());
    }

    if (header === null) {
        header = await shadow.getBlock(block);
    }
    log.ox(JSON.stringify(header, null, 2));
}

async function recipeCodec(api: API, args: yargs.Arguments, shadow: ShadowAPI) {
    const codecBlock: string = (args.block as string);
    let pair: any = null;
    if (codecBlock === "") {
        const hash = await api._.query.ethRelay.bestHeaderHash();
        pair = await shadow.getBlockWithProof(hash.toString());
    }

    // Get proof by hash or number
    if (pair === null) {
        if (codecBlock.length >= 64) {
            pair = await shadow.getBlockWithProof(codecBlock);
        } else {
            pair = await shadow.getBlockWithProof(Number.parseInt(codecBlock, 10));
        }
    }

    log.trace(pair);
    // codec resp
    const resp = {
        eth_header: new Struct(
            api._.registry,
            api.types.EthHeader,
            pair[0]
        ).toHex(),
        proof: new Vec(
            api._.registry,
            (api._.registry.get("DoubleNodeWithMerkleProof") as any),
            pair[1],
        ).toHex(),
    }

    // log proofs
    log.ox(JSON.stringify(resp, null, 2));
}

/**
 * Command Recipe
 */
const cmdRecipe: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("recipe", {
            choices: ["balance", "bestHeader", "header", "codec"],
            default: "balance",
            describe: "the target recipe",
            required: true,
            type: "string",
        }).positional("address", {
            alias: "a",
            default: "",
            describe: "target address",
            type: "string",
        }).positional("block", {
            alias: "b",
            default: "",
            describe: "get block info",
            type: "string",
        });
    },
    command: "info <receipe>",
    describe: "Get info of recipes",
    handler: async (args: yargs.Arguments) => {
        const api = await autoAPI();
        const cfg = new Config();
        const shadow = new ShadowAPI(cfg.shadow);

        switch (args.recipe) {
            case "balance":
                await recipeBalance(api, args);
                break;
            case "bestHeader":
                await recipeBestHeader(api, shadow);
                break;
            case "header":
                await recipeHeader(api, args, shadow);
                break;
            case "codec":
                await recipeCodec(api, args, shadow);
                break;
            default:
                break;
        }
    },
}

export default cmdRecipe;
