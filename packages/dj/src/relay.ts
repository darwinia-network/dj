import yargs from "yargs";
import Relay from "./_relay";
import { ExResult } from "@darwinia/api";
import { log } from "@darwinia/util";

const cmdRelay: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("number", {
            alias: "n",
            default: NaN,
            type: "number",
            describe: "relay specfied eth header to darwinia"
        }).positional("batch", {
            alias: "b",
            default: 1,
            type: "number",
            describe: "relay multiple blocks on every time"
        });
    },
    command: "relay [number] [batch]",
    describe: "Relay eth header to darwinia",
    handler: async (args: yargs.Arguments) => {
        const relayer = await Relay.new();
        if (!isNaN(args.number as number)) {
            await relayer.relay(args.block as number).catch((err: ExResult) => {
                log.ex(err.toString());
            });
        } else { /* use else to avoid exiting process manually */
            let batch = args.batch as number;
            if (batch === 1) {
                await relayer.forever();
            } else {
                await relayer.batchForever(batch);
            }
        }
    },
}

export default cmdRelay;
