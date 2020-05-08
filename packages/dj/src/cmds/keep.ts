import yargs from "yargs";
import { Service } from "../service";
import Grammer from "../grammer";
import Relay from "../relay";
import { execSync } from "child_process";
import { log } from "@darwinia/util";

const cmdKeep: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional('service', {
            choices: ["grammer", "relay"],
            required: true,
        }).option("daemon", {
            alias: "d",
            default: false,
            type: "boolean",
        }).option("port", {
            alias: "p",
            default: null,
            type: "number",
        });
    },
    command: "keep <service>",
    describe: "trigger services",
    handler: async (args: yargs.Arguments) => {
        let daemon: boolean = false;
        let script = `keep ${args.service}`;
        let service: Service | null = null;

        // select service
        switch ((args.service as string)) {
            case "grammer":
                service = await Grammer.new();
                break;
            case "relay":
                service = await Relay.new();
                break;
            default:
                break;
        }

        // not match
        if (service === null) {
            log.ex("paramter not correct, try: `dj keep relay`");
        }

        // load port
        if ((args.port as number)) {
            script += ` -p ${args.port}`;
            (service as Service).port = (args.port as number);
        }

        // load daemon
        if ((args.daemon as boolean)) {
            daemon = true;
        }

        // exec
        if (daemon) {
            execSync(`pm2 start dj -- keep ${script}`);
        } else if ((service as Service).port !== 0) {
            await (service as Service).foreverServe();
        } else {
            await (service as Service).forever();
        }
    },
}

export default cmdKeep;
