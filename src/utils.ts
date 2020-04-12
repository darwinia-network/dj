import fs from "fs";
import path from "path";

import { API } from "./api";
import { Config } from "./cfg";
import { Web3 } from "./web3";

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
    return new Web3(cfg.web3, cfg.ethSk);
}

/**
 * where is my `package.json` ?
 *
 * @return {Object} package.json - find package.json
 */
export function whereisPj(): Record<string, any> {
    let ptr = __dirname;
    let pj: Record<string, any> = {"": ""};

    while (pj === undefined) {
        const files = fs.readdirSync(ptr);
        files.forEach((f: string) => {
            if (f === "package.json") {
                pj = JSON.parse(fs.readFileSync(path.resolve(ptr, f), "utf8"));
            }
        });

        ptr = path.resolve(ptr, "..");
    }

    return pj;
}
