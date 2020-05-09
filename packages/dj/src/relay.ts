import yargs from "yargs";
import Relay from "./_relay";
import { ExResult } from "@darwinia/api";
import { log } from "@darwinia/util";

const cmdRelay: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("block", {
            alias: "b",
            default: NaN,
            type: "number",
            describe: "relay specfied eth header to darwinia"
        });
    },
    command: "relay [block]",
    describe: "Relay eth header to darwinia",
    handler: async (args: yargs.Arguments) => {
        const relayer = await Relay.new();
        if (!isNaN(args.block as number)) {
            await relayer.relay(args.block as number).catch((err: ExResult) => {
                log.ex(err.toString());
            });
        } else { /* use else to avoid exiting process manually */
            relayer.forever();
        }
    },
}

export default cmdRelay;
