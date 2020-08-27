import yargs from "yargs";
import Relay from "./_relay";
import { ExResult } from "../api";
import { log } from "../util";

async function handler(args: yargs.Arguments) {
    const relayer = await Relay.new();
    if (!isNaN(args.number as number)) {
        await relayer.relay(args.block as number).catch((err: ExResult) => {
            log.ex(err.toString());
        });
    } else { /* use else to avoid exiting process manually */
        await relayer.forever(args.batch as number).catch(async (e: any) => {
            log.err(e);
            await handler(args);
        });
    }
}

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
    handler,
}

export default cmdRelay;
