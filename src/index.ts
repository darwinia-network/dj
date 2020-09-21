import { whereisPj, Config, log } from "./util";
import child_process from "child_process";
import { API, ShadowAPI } from "./api";
import * as Listener from "./listener"

// main
export default async function main() {
    if (await cmdOnce()) return;

    // Check verbose module
    if (check("-v") || check("verbose")) {
        process.env.LOGGER = "ALL";
    } else if (process.env.LOGGER === undefined) {
        process.env.LOGGER = "INFO";
    }

    const conf = new Config();
    const api = await API.auto();
    const shadow = new ShadowAPI(conf.shadow);

    // Log current account info
    const balance = await api.getBalance(api.account.address);
    log(`Current account: ${api.account.address}`);
    log(`Current balance: ${balance}`);

    // Start proposal linstener
    Listener.guard(api, shadow);
    Listener.relay(api, shadow);
    Listener.redeem(api, shadow);
    Listener.ethereum(conf.eth);
}

/// Check if has arg
function check(arg: string): boolean {
    return process.argv.indexOf(arg) > -1;
}

/// Run and exit
async function cmdOnce(): Promise<boolean> {
    if (check("--version")) {
        console.log(whereisPj().version);
        return true;
    } else if (check("-h") || check("--help")) {
        console.log("dj: illegal option -- -");
        console.log(`usage: dj [-v verbose-mode] [-c edit-config]`);
        return true;
    } else if (check("-c") || check("--config")) {
        const config = new Config();
        child_process.spawnSync("vi", [config.path], {
            stdio: "inherit",
        });
        return true;
    }

    return false;
}
