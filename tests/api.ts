import { API, log } from "../index";
import types from "./types.json";

(async () => {
    const seed = await API.seed("//Alice");
    const api = await API.new(seed, "ws://0.0.0.0:9944", types);

    const balance = await api.getBalance(api.account.address);
    log(balance);
})();
