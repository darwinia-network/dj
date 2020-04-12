import { autoAPI, autoWeb3, log } from "../index";

(async() => {
    const api = await autoAPI();
    const web3 = await autoWeb3();

    const block = await web3.getBlock(0);
    const res = await api.reset(block);

    log.ox(`reset succeed - ${res.toString()}`);
})();
