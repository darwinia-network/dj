import yargs from "yargs";
import Grammer from "./_bot";

const cmdBot: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("key", {
            alias: "k",
            describe: "the telegram-bot key",
            default: "",
            type: "string",
        });
    },
    command: "bot <key>",
    describe: "start darwinia telegram bot",
    handler: async (args: yargs.Arguments) => {
        const g = await Grammer.new();
        g.run((args.key as string));
    }
}

export default cmdBot;
