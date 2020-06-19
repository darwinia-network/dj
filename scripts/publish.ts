import * as child_process from "child_process";
import { findPjs } from "./packages";

/**
 * publish packages
 */
export function publish(canary = true): void {
    findPjs(false).forEach((pp: [string, Record<string, any>]) => {
        child_process.fork(
            "npm", [
            "publish",
            canary ? "--tag" : "",
            canary ? "canary" : ""
        ], {
            cwd: pp[0],
        }).stdout.on("data", (data: any) => {
            console.log(data);
        });
    });
}

(() => {
    let canary = true;
    if (process.argv.length == 3 && process.argv[2] === "stable") {
        canary = false;
    }
    publish(canary);
    console.log(`Publishing ${canary ? "patch" : "minor"} version...ok`);
})();
