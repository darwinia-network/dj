import { ShadowAPI } from "./shadow";

(async () => {
    const api = new ShadowAPI("http://localhost:3000");

    const res = await api.batchBlockWithProofByNumber(1, 3);
    console.log(res)
})();
