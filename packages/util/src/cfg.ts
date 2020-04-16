import child_process from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

import rawDj from "./static/dj.json";
import rawTj from "./static/types.json";
import { download } from "./download";
import { log } from "./log";

// constants
export const TYPES_URL = "https://raw.githubusercontent.com/darwinia-network/darwinia/master/runtime/crab/types.json"


// interfaces
export interface IConfigPath {
    conf: string;
    db: IDatabaseConfig;
    root: string;
    types: string;
}

export interface IDatabaseConfig {
    crash: string;
    fetcher: string;
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
 * @property {IConfigPath} path - darwinia config paths
 * @property {IDatabaseConfig} db - darwinia database config
 * @property {IEthConfig} eth - darwinia eth config
 * @property {IGrammerConfig} grammer - darwinia grammer config
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
        const grammer = path.resolve(root, "grammer.yml");

        // database
        const db = path.resolve(root, "database");
        const crash = path.resolve(db, "crash.db");
        const fetcher = path.resolve(db, "fetcher.db");

        // init pathes
        this.path = {
            conf, db: { crash, fetcher }, root, types
        };

        // check database dir - the deepest
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

        // migrate grammer.yml
        if (!fs.existsSync(grammer)) {
            fs.copyFileSync(path.resolve(__dirname, "static/grammer.yml"), grammer);
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
     * edit dj.json
     */
    public async edit(): Promise<void> {
        child_process.spawnSync("vi", [this.path.conf], {
            stdio: "inherit",
        });
    }

    /**
     * update types.json
     */
    public async updateTypes(): Promise<void> {
        await download(this.path.root, TYPES_URL, "types.json");
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
