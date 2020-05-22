import { API } from "./api";
import { Config } from "@darwinia/util";

/**
 * @return {API} api - generate API automatically
 */
export async function autoAPI(): Promise<API> {
    const cfg = new Config();
    const seed = await cfg.checkSeed();
    return await API.new(seed, cfg.node, cfg.types);
}
