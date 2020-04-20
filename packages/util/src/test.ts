import { Config } from "./cfg";

(async() => {
    const cfg = new Config();
    const res = await cfg.proofBlock(1);
    console.log(JSON.stringify(res));
})();
