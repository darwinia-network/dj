import yargs from "yargs";
import Grammer from "./_grammer";

const cmdBot: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("key", {
            alias: "k",
            describe: "the telegram-bot key",
            default: "",
            type: "string",
        }).positional("config", {
            alias: "c",
            describe: "the path of grammer.yml",
            default: "",
            type: "string",
        });
    },
    command: "bot <key> [config]",
    describe: "start darwinia telegram bot",
    handler: async (args: yargs.Arguments) => {
        const g = await Grammer.new((args.config as string));
        g.run((args.key as string));
    }
}

export default cmdBot;
