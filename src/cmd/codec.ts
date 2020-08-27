import yargs from "yargs";
import { autoAPI, ShadowAPI } from "../api";
import { Vec, Struct } from "@polkadot/types";
import { Config, log } from "../util";

/**
 * Command Recipe
 */
const cmdCodec: yargs.CommandModule = {
    command: "codec <block>",
    describe: "Get info of recipes",
    handler: async (args: yargs.Arguments) => {
        const api = await autoAPI();
        const cfg = new Config();
        const shadow = new ShadowAPI(cfg.shadow);

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
    },
}

export default cmdCodec;
