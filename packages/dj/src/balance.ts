import yargs from "yargs";
import { autoAPI } from "@darwinia/api";
import { log } from "@darwinia/util";

const cmdBalance: yargs.CommandModule = {
    builder: (argv: yargs.Argv) => {
        return argv.positional("address", {
            alias: "a",
            default: "",
            type: "string",
            describe: "Account address"
        });
    },
    command: "balance [address]",
    describe: "Get balance of account address",
    handler: async (args: yargs.Arguments) => {
        const api = await autoAPI();
        let addr = (args.address as string);
        if (addr === "") {
            addr = api.account.address;
        }

        const balance = await api.getBalance(addr);
        const s = balance + " RING 💰";
        log.ox(s);
    },
}

export default cmdBalance;
