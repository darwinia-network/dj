import * as fs from "fs";
import { PACKAGES, findPjs, fillNames } from "./packages";

/**
 * Update minor version
 *
 * @param {string} version - the target version
 * @returns {string} version
 */
function updateVersion(ver: string, patch = true): string {
    const vers: string[] = ver.match(/(\d+)\.(\d+)\.(\d+)/).slice(1);
    const pos = patch ? 1 : 2;
    vers[vers.length - pos] = "" + (Number.parseInt(vers[vers.length - pos]) + 1);
    return vers.join(".");
}

/**
 * Main func
 */
export function version(patch = true, stable = true): void {
    const pjs = findPjs();
    pjs.forEach((pp) => {
        let [p, j] = pp;
        j.version = updateVersion(j.version, patch);
        if (stable) {
            fillNames(PACKAGES).forEach((n) => {
                if (j["dependencies"][n]) {
                    j["dependencies"][n] = "^" + j.version;
                }
            });
        }

        fs.writeFileSync(p, JSON.stringify(j, null, 2));
    });
}

(() => {
    let [patch, stable] = [true, false];
    if (process.argv.indexOf("--minor") > -1) {
        patch = false;
    }

    if (process.argv.indexOf("--stable") > -1) {
        stable = true;
    }

    version(patch, stable);
    console.log(`Updating ${patch ? "patch" : "minor"} version...ok`);
})();
