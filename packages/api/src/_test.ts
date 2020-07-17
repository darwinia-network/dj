import { Config } from "@darwinia/util";
import { ShadowAPI } from "./shadow";

(async () => {
    const cfg = new Config();
    const shadow = new ShadowAPI("http://localhost:3001/api/v1");
    console.log(await shadow.getProposal([0], 1));
})();
