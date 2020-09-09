import chalk from "chalk";
import fs from "fs";
import got from "got";
import path from "path";
import Progress from "progress";

/**
 * Download the get resp to file
 *
 * @param {String} dir  - target directory
 * @param {String} url  - source url
 * @param {String} file - file name
 */
export async function download(
    dir: string,
    url: string,
    file: string,
): Promise<void> {
    fs.mkdirSync(dir, { recursive: true });
    const bar = new Progress(`[ ${chalk.cyan("wait")} ] [:bar] :rate/bps :etas`, {
        complete: '=',
        incomplete: ' ',
        width: 42,
        total: 1,
    });

    let prePercent = 0;
    const res = await got(url)
        .on("downloadProgress", (progress) => {
            bar.tick(progress.percent - prePercent);
            prePercent = progress.percent;
        });

    fs.writeFileSync(path.resolve(dir, file), res.body);
}
