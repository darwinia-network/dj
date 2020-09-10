import { autoAPI, ShadowAPI } from "../api";
import { ITx } from "../types";
import { Config, log } from "../util";
import * as Listener from "../listener"

const QUEUE: ITx[] = [];

// The proposal API
export async function run() {
    Listener.Cache.initCache();

    const conf = new Config();
    const api = await autoAPI();
    const shadow = new ShadowAPI(conf.shadow);

    // Log current account info
    const balance = await api.getBalance(api.account.address);
    log(`Current account: ${api.account.address}`);
    log(`Current balance: ${balance}`);

    // Start proposal linstener
    Listener.guard(api, shadow);
    Listener.relay(api, shadow, QUEUE);
    Listener.ethereum(conf.eth, QUEUE);
}
