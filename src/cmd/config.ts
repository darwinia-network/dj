import yargs from "yargs";
import {
    Config,
} from "../util";
import child_process from "child_process";

const config: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("edit", {
            alias: "e",
            describe: "edit the config of darwinia.js",
            default: false,
            type: "boolean",
        });
    },
    command: "config",
    describe: "Show config",
    handler: async (_args: yargs.Arguments) => {
        const cfg = new Config();
        child_process.spawnSync("vi", [cfg.path], {
            stdio: "inherit",
        });
    },
}

export default config;
