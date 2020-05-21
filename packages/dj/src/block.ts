import yargs from "yargs";
import { autoAPI } from "@darwinia/api";
import { log } from "@darwinia/util";

const cmdBalance: yargs.CommandModule = {
    command: "block <numberOrHash>",
    describe: "Get block by number or hash",
    handler: async (args: yargs.Arguments) => {
        const api = await autoAPI();
        const block: number | string = (args.numberOrHash as number | string);
        const res = await api.getBlock(block);
        log.ox(res);
    },
}

export default cmdBalance;
