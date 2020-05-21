import child_process from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import prompts from "prompts";
import { download } from "./download";
import { log } from "./log";
import rawCj from "./static/config.json";
import rawTj from "./static/types.json";

// constants
export const TYPES_URL = "https://raw.githubusercontent.com/darwinia-network/darwinia/master/runtime/crab/darwinia_types.json"

// interfaces
export interface IConfig {
    node: string;
    seed: string;
    shadow: string;
}

export interface IConfigPath {
    conf: string;
    root: string;
    types: string;
}

/**
 * darwinia.js config
 *
 * @property {IConfigPath} path - darwinia config paths
 * @property {String} node - darwinia node address
 * @property {String} seed - darwinia account seed
 */
export class Config {
    static warn(config: Config) {
        if (config.shadow === "") {
            log.warn([
                "shadow address has not been configured, ",
                "edit `~/.darwinia/config.json` if it is required",
            ].join(""));
        }

        if (config.node === "") {
            log.ex("darwinia node has not been configured");
        }
    }

    public node: string;
    public path: IConfigPath;
    public shadow: string;
    public types: Record<string, any>;
    private seed: string;

    constructor() {
        const home = os.homedir();
        const root = path.resolve(home, ".darwinia");
        const conf = path.resolve(root, "config.json");
        const types = path.resolve(root, "types.json");

        // init pathes
        this.path = {
            conf,
            root,
            types
        };

        // check root
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root, { recursive: true });
        }

        // load config.json
        let cj: IConfig = rawCj;
        if (!fs.existsSync(conf)) {
            fs.writeFileSync(conf, JSON.stringify(cj, null, 2));
        } else {
            const curConfig = JSON.parse(fs.readFileSync(conf, "utf8"));
            const mergeConfig = Object.assign(rawCj, curConfig);
            if (mergeConfig !== curConfig) {
                fs.writeFileSync(conf, JSON.stringify(mergeConfig, null, 2));
            }

            // assign cj
            cj = mergeConfig;
        }

        // load types.json
        let tj: Record<string, any> = rawTj;
        if (!fs.existsSync(types)) {
            fs.writeFileSync(types, JSON.stringify(tj, null, 2));
        } else {
            tj = JSON.parse(fs.readFileSync(types, "utf8"));
        }

        this.node = cj.node;
        this.seed = cj.seed;
        this.shadow = cj.shadow;
        this.types = tj;

        // Warn config
        Config.warn(this);
    }

    /**
     * Raise a prompt if seed not exists
     */
    public async checkSeed(): Promise<string> {
        if (this.seed !== "") {
            return this.seed;
        }

        const ans = await prompts({
            type: "text",
            name: "seed",
            message: "Please input your darwinia seed:",
        }, {
            onCancel: () => {
                log.ex("You can fill the seed field in `~/.darwinia/config.json` manually");
            }
        });

        const curConfig: IConfig = JSON.parse(fs.readFileSync(this.path.conf, "utf8"));
        const seed = String(ans.seed).trim();
        curConfig.seed = seed;
        this.seed = seed;
        fs.writeFileSync(
            this.path.conf,
            JSON.stringify(curConfig, null, 2)
        );

        return seed;
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
