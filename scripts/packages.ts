import * as fs from "fs";
import * as path from "path";

export const PACKAGES = [
    "api",
    "dactle",
    "dj",
    "util",
];

/**
 * Add prefix for package names
 *
 * @param {string[]} names - package names
 * @returns {string} - package name with prefix
 */
export function fillNames(names: string[]): string[] {
    return names.map((e) => "@darwinia/" + e);
}

/**
 * Find all `package.json`
 *
 * @returns {Record<string, any>} - package.json files
 */
export function findPjs(json = true): [string, Record<string, any>][] {
    let root = path.resolve(__dirname, "../packages");

    const pjs: [string, Record<string, any>][] = [];
    for (let s in PACKAGES) {
        const pp = path.resolve(root, PACKAGES[s], "package.json");
        pjs.push([pp, json ? JSON.parse(fs.readFileSync(pp).toString()) : {}]);
    }

    return pjs;
}
