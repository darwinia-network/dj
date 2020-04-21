import child_process from "child_process";
import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";

import { download, downloadTar } from "./download";
import { log } from "./log";
import { IDoubleNodeWithMerkleProof, getProof } from "./proof";
import rawDj from "./static/dj.json";
import rawTj from "./static/types.json";


// constants
export const TYPES_URL = "https://raw.githubusercontent.com/darwinia-network/darwinia/master/runtime/crab/darwinia_types.json"
export const ETHASHPROOF_URL_OSX = "https://github.com/darwinia-network/darwinia.js/releases/download/ethproofhash/ethashproof-osx.tar.gz"
export const ETHASHPROOF_URL_LINUX = "https://github.com/darwinia-network/darwinia.js/releases/download/ethproofhash/ethashproof-linux.tar.gz"

// interfaces
export interface IConfig {
    eth: IEthConfig;
    node: string;
    seed: string;
}

export interface IConfigPath {
    bin: string;
    conf: string;
    db: IDatabaseConfig;
    grammer: string;
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
    node: string;
    path: IConfigPath;
    seed: string;
    types: Record<string, any>;

    constructor() {
        const home = os.homedir();
        const root = path.resolve(home, ".darwinia");
        const bin = path.resolve(root, "bin");
        const conf = path.resolve(root, "dj.json");
        const types = path.resolve(root, "types.json");
        const grammer = path.resolve(root, "grammer.yml");

        // database
        const db = path.resolve(root, "database");
        const crash = path.resolve(db, "crash.db");
        const fetcher = path.resolve(db, "fetcher.db");

        // init pathes
        this.path = {
            bin,
            conf,
            db: {
                crash,
                fetcher
            },
            grammer,
            root,
            types
        };

        // check database dir - the deepest
        if (!fs.existsSync(bin)) {
            fs.mkdirSync(bin, { recursive: true });
        }

        // check database dir - the deepest
        if (!fs.existsSync(db)) {
            fs.mkdirSync(db, { recursive: true });
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
     * download ethashproof binaries
     */
    public async downloadEthashProofBins(): Promise<void> {
        if (os.type() === "Darwin") {
            await downloadTar(this.path.bin, ETHASHPROOF_URL_OSX, "ethashproof");
        } else if (os.type() === "Linux") {
            await downloadTar(this.path.bin, ETHASHPROOF_URL_LINUX, "ethashproof");
        } else {
            log.ex([
                "only support downloading darwin binaries for now, you can ",
                `go to ${chalk.cyan.underline("https://github.com/darwinia-network/ethashproof")} `,
                `and compile the cmds into ${this.path.bin} your self.`
            ].join(""));
        }
    }


    /**
     * proof eth block
     */
    public async proofBlock(blockNumber: number): Promise<IDoubleNodeWithMerkleProof[]> {
        const relayer = path.resolve(this.path.bin, "relayer");
        if (!fs.existsSync(relayer)) {
            log.event("download eth hash proof binaries.");
            await this.downloadEthashProofBins();
        }

        return await getProof(blockNumber, relayer);
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
