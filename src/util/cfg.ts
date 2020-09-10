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

// Interfaces
// Ethereum Config
interface IEthConfig {
    RPC_SERVER: string;
    START_BLOCK_NUMBER: number;
    CONTRACT: {
        RING: {
            address: string;
            burnAndRedeemTopics: string;
        },
        KTON: {
            address: string;
            burnAndRedeemTopics: string;
        },
        BANK: {
            address: string;
            burnAndRedeemTopics: string;
        }
        ISSUING: {
            address: string;
        }
    }
}

export interface IConfig {
    node: string;
    seed: string;
    shadow: string;
    eth: IEthConfig;
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

    /// Load and merge config from file
    static load(p: string, defaultConfig: Record<string, any>): Record<string, any> {
        let json: Record<string, any> = defaultConfig;
        if (!fs.existsSync(p)) {
            fs.writeFileSync(p, JSON.stringify(json, null, 2));
        } else {
            const cur = Object.assign(json, JSON.parse(fs.readFileSync(p, "utf8")));
            fs.writeFileSync(p, JSON.stringify(cur, null, 2));
            json = cur;
        }

        return json
    }

    public eth: IEthConfig;
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

        // Init pathes
        this.path = {
            conf,
            root,
            types,
        };

        // Check root
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root, { recursive: true });
        }

        const cj = Config.load(conf, rawCj);
        this.node = cj.node;
        this.seed = cj.seed;
        this.shadow = cj.shadow;
        this.eth = cj.eth;
        this.types = Config.load(types, rawTj);

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
