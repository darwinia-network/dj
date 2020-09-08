import { autoAPI, ShadowAPI } from "../api";
import { log, Config } from "../util";
import * as Listener from "../listener"

// The proposal API
export async function run() {
    Listener.Cache.initCache();

    const conf = new Config();
    const api = await autoAPI();
    const shadow = new ShadowAPI(conf.shadow);

    // Start proposal linstener
    Listener.proposal(api, shadow);
    Listener.ethereum(conf.ethereumListener, (tx: string, ty: string) => {
        log(tx);
        log(ty);
    })
}
