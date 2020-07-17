import { Config } from "@darwinia/util";
import { ShadowAPI } from "./shadow";

(async () => {
    const cfg = new Config();
    const shadow = new ShadowAPI("http://localhost:3001/api/v1");
    console.log(await shadow.getReceipt("0x33d48b9108b72d4bfa238124717e0b36cbaf404b01b158013901e86f7368912d", 0));
})();
