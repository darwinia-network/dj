// import { Config } from "@darwinia/util";
// import { ShadowAPI } from "./shadow";
import { autoAPI } from "./auto";
import codec from "./19.json";

(async () => {
    // const cfg = new Config();
    const api = await autoAPI();
    const r = await api.submit_proposal([codec.codec]);
    console.log(r);
})();
