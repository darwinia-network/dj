import yargs from "yargs";
import { autoAPI, ExResult } from "@darwinia/api";
import { log } from "@darwinia/util";

const cmdTransfer: yargs.CommandModule = {
    builder: {},
    command: "transfer <address> <amount>",
    describe: "Transfer RING to darwinia account",
    handler: async (args: yargs.Arguments) => {
        const api = await autoAPI();
        const res = await api.transfer(
            (args.address as string),
            (args.amount as number),
        ).catch((e: ExResult) => {
            log.ex(e.toString());
        });

        log.ox("transfer succeed 💰 - " + (res as ExResult).toString());
    }
}

export default cmdTransfer;
