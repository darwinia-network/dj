#!/usr/bin/env node
import { Config, log } from "../util";
import { API, ShadowAPI } from "../api";

(async () => {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.log("Usage:   dj-verify <tx>/<confirmed> [-d deposit]");
        console.log("Example: dj-verify 0x1d3ef601b9fa4a7f1d6259c658d0a10c77940fa5db9e10ab55397eb0ce88807d/8694126");
        console.log("Example: dj-verify 0x1d3ef601b9fa4a7f1d6259c658d0a10c77940fa5db9e10ab55397eb0ce88807d/8694126 -d");
        return;
    }

    /// Init logs
    process.env.LOGGER = "ALL";

    /// Init API
    const conf = new Config();
    const api = await API.auto();
    const shadow = new ShadowAPI(conf.shadow);
    const target = args[0].split("/");

    // Trigger relay
    try {
        await api.redeem(
            args.indexOf("-d") > -1? "Deposit": "Token",
            await shadow.getReceipt(target[0], Number.parseInt(target[1], 10))
        );
        log.ox(`Redeem tx ${target} succeed!`);
    } catch (e) {
        log.ex(e);
    }
})();
