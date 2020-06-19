import * as fs from "fs";
import { PACKAGES, findPjs, fillNames } from "./packages";

/**
 * Update minor version
 *
 * @param {string} version - the target version
 * @returns {string} version
 */
function updateVersion(ver: string, patch = true): string {
    const vers: string[] = ver.split(".");
    const pos = patch ? 1 : 2;
    vers[vers.length - pos] = "" + (Number.parseInt(vers[vers.length - pos]) + 1);
    return vers.join(".");
}

/**
 * Main func
 */
export function version(patch = true): void {
    const pjs = findPjs();
    pjs.forEach((pp) => {
        let [p, j] = pp;
        j.version = updateVersion(j.version, patch);
        fillNames(PACKAGES).forEach((n) => {
            if (j["dependencies"][n]) {
                j["dependencies"][n] = updateVersion(j["dependencies"][n], patch);
            }
        });

        fs.writeFileSync(p, JSON.stringify(j, null, 2));
    });
}

(() => {
    let patch = true;
    if (process.argv.length == 3 && process.argv[2] === "minor") {
        patch = false;
    }
    version(patch);
    console.log(`Updating ${patch ? "patch" : "minor"} version...ok`);
})();
