import * as fs from "fs";
import * as path from "path";

const PACKAGES = [
    "api",
    "dactle",
    "dj",
    "util",
];

/**
 * Find all `package.json`
 *
 * @returns {Record<string, any>} - package.json files
 */
function findPjs(): [string, Record<string, any>][] {
    let root = path.resolve(__dirname, "../packages");

    const pjs: [string, Record<string, any>][] = [];
    for (let s in PACKAGES) {
        pjs.push([PACKAGES[s], JSON.parse(fs.readFileSync(
            path.resolve(root, PACKAGES[s], "package.json"),
        ).toString())]);
    }

    return pjs;
}

/**
 * Add prefix for package names
 *
 * @param {string[]} names - package names
 * @returns {string} - package name with prefix
 */
function fillNames(names: string[]): string[] {
    return names.map((e) => "@darwinia/" + e);
}

/**
 * Update minor version
 *
 * @param {string} version - the target version
 * @returns {string} version
 */
function updateVersion(ver: string): string {
    const vers: string[] = ver.split(".");
    vers[vers.length - 1] = "" + Number.parseInt(vers[vers.length - 1]) + 1;
    return vers.join(".");
}

/**
 * Main func
 */
function main(): void {
    const pjs = findPjs();
    pjs.forEach((pp) => {
        let [p, j] = pp;
        j.version = updateVersion(j.version);
        fillNames(PACKAGES).forEach((n) => {
            if (j["dependencies"][n]) {
                j["dependencies"][n] = updateVersion(j["dependencies"][n]);
            }
        });

        fs.writeFileSync(p, j);
    });
}

(() => {
    main();
})
