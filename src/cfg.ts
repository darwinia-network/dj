import fs from "fs";
import os from "os";
import path from "path";

export interface IConfig {
    node: string;
    seed: string;
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
    public node: string;
    public rootPath: string;
    public seed: string;
    public types: Record<string, any>;
    public typesPath: string;

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
        let cs: string = "";
        if (!fs.existsSync(cfgPath)) {
            cs = fs.readFileSync("./json/dj.json", "utf8");
            fs.writeFileSync(cfgPath, cs);
        } else {
            cs = fs.readFileSync(cfgPath, "utf8");
        }

        // load types.json
        let ts: string = "";
        if (!fs.existsSync(cfgPath)) {
            ts = fs.readFileSync("./json/types.json", "utf8");
            fs.writeFileSync(cfgPath, cs);
        } else {
            ts = fs.readFileSync(cfgPath, "utf8");
        }

        // load config
        const cj: IConfig = JSON.parse(cs);
        const tj: IConfig = JSON.parse(ts);
        this.node = cj.node;
        this.seed = cj.seed;
        this.types = tj;
    }
}
