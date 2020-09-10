import { Config } from "../util";
import path from "path";
import fs from "fs";
import { IEthereumHeaderThingWithProof } from "../types";

const cache = path.resolve((new Config()).path.root, "cache/blocks");

// Init Cache
export function initCache() {
    if (fs.existsSync(cache)) {
        fs.rmdirSync(cache, { recursive: true });
    }

    fs.mkdirSync(cache, { recursive: true });
}

// Get block from cache
export function getBlock(block: number): IEthereumHeaderThingWithProof | null {
    const f = path.resolve(cache, `${block}.block`);
    if (fs.existsSync(f)) {
        return JSON.parse(fs.readFileSync(f).toString());
    } else {
        return null;
    }
}

// Get block from cache
export function setBlock(block: number, headerThing: IEthereumHeaderThingWithProof) {
    fs.writeFileSync(path.resolve(cache, `${block}.block`), JSON.stringify(headerThing));
}
