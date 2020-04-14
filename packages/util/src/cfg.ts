import fs from "fs";
import os from "os";
import path from "path";

import rawDj from "./json/dj.json";
import rawTj from "./json/types.json";
import { log } from "./log";

export interface IConfigPath {
    conf: string;
    root: string;
    types: string;
}

export interface IEthConfig {
    node: string;
    secret: string;
}

export interface IConfig {
    eth: IEthConfig;
    node: string;
    seed: string;
}

/**
 * darwinia.js config
 *
 * @property {IEthConfig} eth - darwinia eth config
 * @property {IConfigPath} path - darwinia config paths
 * @property {String} node - darwinia node address
 * @property {String} seed - darwinia account seed
 */
export class Config {
    eth: IEthConfig;
    path: IConfigPath;
    node: string;
    seed: string;
    types: Record<string, any>;

    constructor() {
        const home = os.homedir();
        const root = path.resolve(home, ".darwinia");
        const conf = path.resolve(root, "dj.json");
        const types = path.resolve(root, "types.json");

        // init pathes
        this.path = { conf, root, types };

        // check root dir
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root, { recursive: true });
        }

        // load dj.json
        let dj: IConfig = rawDj;
        if (!fs.existsSync(conf)) {
            fs.writeFileSync(conf, JSON.stringify(dj, null, 2));
        } else {
            dj = JSON.parse(fs.readFileSync(conf, "utf8"));
        }

        // load types.json
        let tj: Record<string, any> = rawTj;
        if (!fs.existsSync(types)) {
            fs.writeFileSync(types, JSON.stringify(tj, null, 2));
        } else {
            tj = JSON.parse(fs.readFileSync(types, "utf8"));
        }

        // load config
        this.eth = {
            node: dj.eth.node,
            secret: dj.eth.secret,
        }
        this.node = dj.node;
        this.seed = dj.seed;
        this.types = tj;

        // warnings
        if (this.eth.node === "") {
            log.warn([
                "web3 node has not been configured, ",
                "edit `~/.darwinia/dj.json` if it is required",
            ].join(""));
        }

        if (this.eth.secret === "") {
            log.warn([
                "eth secret key has not been configured, ",
                "edit `~/.darwinia/dj.json` if it is required",
            ].join(""));
        }
    }


    /**
     * print config to string
     */
    public toString(): string {
        return JSON.stringify(
            fs.readFileSync(this.path.conf, "utf8"),
            null,
            2
        );
    }
}
