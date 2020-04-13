import { API } from "./api";
import { Web3 } from "./web3";
import { Config } from "@darwinia/util";

/**
 * @return {API} api - generate API automatically
 */
export async function autoAPI(): Promise<API> {
    const cfg = new Config();
    const seed = await API.seed(cfg.seed);
    return await API.new(seed, cfg.node, cfg.types);
}

/**
 * @return {Web3} api - generate Web3 automatically
 */
export async function autoWeb3(): Promise<Web3> {
    const cfg = new Config();
    return new Web3(cfg.eth.node, cfg.eth.secret);
}

