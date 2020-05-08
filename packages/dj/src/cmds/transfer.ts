import chalk from "chalk";
import yargs from "yargs";
import { autoAPI, ExResult } from "@darwinia/api";
import { log } from "@darwinia/util";

const cmdTransfer: yargs.CommandModule = {
    builder: {},
    command: "transfer <address> <amount>",
    describe: "Transfer RING to darwinia account",
    handler: async (args: yargs.Arguments) => {
        const api = await autoAPI();
        const res: ExResult = await api.transfer(
            (args.address as string),
            (args.amount as number),
        );

        if (res.isOk) {
            log.ok("transfer succeed 💰");
            log.ox(chalk.cyan.underline(
                `https://crab.subscan.io/extrinsic/${(res as ExResult).exHash}`
            ));
        } else {
            log.ex("transfer failed - " + (res as ExResult).toString());
        }
    }
}

export default cmdTransfer;
