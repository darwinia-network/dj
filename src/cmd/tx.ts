import yargs from "yargs";
import { API } from "../api";
import { log } from "../util";

const cmdTx: yargs.CommandModule = {
    command: "tx <hash>",
    describe: "Get tx by hash",
    handler: async (args: yargs.Arguments) => {
        const hash: number | string = (args.hash as string);
        const res = await API.getExtrinsic(hash);
        log.ox(JSON.stringify(res, null, 2));
    },
}

export default cmdTx;
