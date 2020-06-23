import * as child_process from "child_process";
import * as path from "path";
import { findPjs } from "./packages";

/**
 * publish packages
 */
export function publish(canary = true): void {
    child_process.spawnSync("yrm", ["use", "npm"], { stdio: "inherit" });
    child_process.spawnSync("lerna", ["run", "build"], { stdio: "inherit" });

    // publish packages
    findPjs(false).forEach((pp: [string, Record<string, any>]) => {
        const cwd = path.resolve(pp[0], "..");
        child_process.spawnSync(
            `npm`, [
            "publish",
            "--tag",
            canary ? "canary" : "latest",
        ], { cwd, stdio: "inherit" });
    });
}

(() => {
    let canary = true;
    if (process.argv.indexOf("--stable") > -1) {
        canary = false;
    }

    publish(canary);
})();
