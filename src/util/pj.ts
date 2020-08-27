import fs from "fs";
import path from "path";

/**
 * where is my `package.json` ?
 *
 * @param {String} name - package name
 * @return {Object} package.json - find package.json
 */
export function whereisPj(): Record<string, any> {
    let ptr = __dirname;
    let pj: Record<string, any> = { "": "" };

    while (pj.version === undefined) {
        const files = fs.readdirSync(ptr);
        files.forEach((f: string) => {
            if (f === "package.json") {
                pj = JSON.parse(fs.readFileSync(path.resolve(ptr, f), "utf8"));
            }
        });

        ptr = path.resolve(ptr, "..");
    }

    return pj;
}
