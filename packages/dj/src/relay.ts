import yargs from "yargs";
import Relay from "./_relay";

const cmdRelay: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("port", {
            alias: "p",
            default: 3000,
            type: "number",
            describe: "the port of relayer"
        });
    },
    command: "relay [port]",
    describe: "Relay eth header to darwinia",
    handler: async (args: yargs.Arguments) => {
        const relayer = await Relay.new();
        if ((args.port as number)) {
            relayer.port = (args.port as number);
        }

        // start relay service
        relayer.forever();
    },
}

export default cmdRelay;
