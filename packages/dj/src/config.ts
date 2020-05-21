import yargs from "yargs";
import {
    Config, chalk, log, TYPES_URL,
} from "@darwinia/util";

const config: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("edit", {
            alias: "e",
            describe: "edit the config of darwinia.js",
            default: false,
            type: "boolean",
        }).positional("update", {
            alias: "u",
            describe: "update the types.json of darwinia.js",
            default: false,
            type: "boolean",
        });
    },
    command: "config [edit]",
    describe: "Show config",
    handler: async (args: yargs.Arguments) => {
        const cfg = new Config();

        if ((args.edit as boolean)) {
            cfg.edit();
        } else if ((args.update as boolean)) {
            await cfg.updateTypes().catch((e: any) => {
                log.err(e.toString());
                log.err([
                    "network connection fail, please check your network: ",
                    `you can download types.json from ${chalk.cyan.underline(TYPES_URL)}`,
                    `your self, and put it into ${cfg.path.root}`
                ].join(""));
            });
        } else {
            log.n(JSON.parse(cfg.toString()));
        }
    },
}

export default config;
