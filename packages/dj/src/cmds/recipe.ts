import yargs from "yargs";
import { autoAPI, ShadowAPI } from "@darwinia/api";
import { Vec, Struct } from "@polkadot/types";
import { Config, IDarwiniaEthBlock, log } from "@darwinia/util";

const cmdRecipe: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("recipe", {
            alias: "r",
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
    command: "info <recipe>",
    describe: "Get info of some recipes",
    handler: async (args: yargs.Arguments) => {
        const api = await autoAPI();
        const cfg = new Config();
        const shadow = new ShadowAPI(cfg.shadow);

        switch (args.recipe) {
            case "balance":
                let addr = (args.address as string);
                if (addr === "") {
                    addr = api.account.address;
                }

                const balance = await api.getBalance(addr);
                const s = balance + " RING 💰";
                log.ox(s);
                break;
            case "bestHeader":
                const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
                const last = await shadow.getBlock(bestHeaderHash.toString());
                log.ox(JSON.stringify(last, null, 2));
                break;
            case "header":
                const block = (args.block as string);
                let header: IDarwiniaEthBlock | null = null;
                if (block === "") {
                    const hash = await api._.query.ethRelay.bestHeaderHash();
                    header = await shadow.getBlock(hash.toString());
                }

                header = await shadow.getBlock(block);
                log.ox(JSON.stringify(header, null, 2));
                break;
            case "codec":
                const codecBlock: string = (args.block as string);
                if (codecBlock === "") {
                    const hash = await api._.query.ethRelay.bestHeaderHash();
                    log.ox(JSON.stringify(shadow.getBlockWithProof(hash.toString()), null, 2))
                }

                // Get proof by hash or number
                let pair: any;
                if (codecBlock.length >= 64) {
                    pair = shadow.getBlockWithProof(codecBlock);
                } else {
                    pair = shadow.getBlockWithProof(Number.parseInt(codecBlock, 10));
                }

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
                log.ox(JSON.stringify(resp, null, 2))
                break;
            default:
                break;
        }
    },
}

export default cmdRecipe;
