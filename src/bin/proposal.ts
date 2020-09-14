#!/usr/bin/env node
import { Config, log } from "../util";
import { API, ShadowAPI } from "../api";

(async () => {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        log.warn("Usage: dj-proposal <number>");
        return;
    }

    /// Init logs
    process.env.LOGGER = "ALL";

    /// Init API
    const conf = new Config();
    const api = await API.auto();
    const shadow = new ShadowAPI(conf.shadow);
    const target = Number.parseInt(args[0], 10);

    // Trigger relay
    const lastConfirmed = await api.lastConfirm();
    try {
        await api.submitProposal([await shadow.getProposal(
            lastConfirmed,
            target,
            target - 1,
        )]);

        log.ox(`Submitted proposal ${target}`);
    } catch (e) {
        log.ex(e);
    }
})();
