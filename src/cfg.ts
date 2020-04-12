import fs from "fs";
import os from "os";
import path from "path";

import rawDj from "./json/dj.json";
import rawTj from "./json/types.json";

export interface IConfig {
    ethSk: string;
    node: string;
    seed: string;
    web3: string;
}

/**
 * darwinia.js config
 *
 * @property {String} cfgPath - the path of `dj.json`
 * @property {String} node - darwinia node address
 * @property {String} rootPath - the path of `.darwinia`
 * @property {String} seed - darwinia account seed
 * @property {Record<string, any>} types - darwinia types
 * @property {String} typesPath - this path of `types.json`
 */
export class Config {
    public cfgPath: string;
    public ethSk: string;
    public node: string;
    public rootPath: string;
    public seed: string;
    public types: Record<string, any>;
    public typesPath: string;
    public web3: string;

    constructor() {
        const home = os.homedir();
        const rootPath = path.resolve(home, ".darwinia");
        const cfgPath = path.resolve(rootPath, "dj.json");
        const typesPath = path.resolve(rootPath, "types.json");

        // init pathes
        this.cfgPath = cfgPath;
        this.rootPath = rootPath;
        this.typesPath = typesPath;

        // check root dir
        if (!fs.existsSync(home)) {
            fs.mkdirSync(home, { recursive: true });
        }

        // load dj.json
        let dj: IConfig = rawDj;
        if (!fs.existsSync(cfgPath)) {
            fs.writeFileSync(cfgPath, dj);
        } else {
            dj = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
        }

        // load types.json
        let tj: Record<string, any> = rawTj;
        if (!fs.existsSync(typesPath)) {
            fs.writeFileSync(typesPath, tj);
        } else {
            tj = JSON.parse(fs.readFileSync(typesPath, "utf8"));
        }

        // load config
        this.ethSk = dj.ethSk;
        this.node = dj.node;
        this.seed = dj.seed;
        this.web3 = dj.web3;
        this.types = tj;
    }
}
