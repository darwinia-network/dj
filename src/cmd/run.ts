import { autoAPI, ShadowAPI } from "../api";
import { ITx } from "../types";
import { Config } from "../util";
import * as Listener from "../listener"

const QUEUE: ITx[] = [];

// The proposal API
export async function run() {
    Listener.Cache.initCache();

    const conf = new Config();
    const api = await autoAPI();
    const shadow = new ShadowAPI(conf.shadow);

    // Start proposal linstener
    Listener.guard(api, shadow);
    Listener.relay(api, shadow, QUEUE);
    Listener.ethereum(conf.eth, QUEUE);
}
