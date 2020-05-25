/**
 * The is a shadow command
 */
import { API, autoAPI, ShadowAPI, ExResult } from "@darwinia/api";
import { BlockWithProof, Config, chalk, log } from "@darwinia/util";

/**
 * Keep relay ethereum blocks to darwinia
 *
 * @property {Boolean} alive - service alive flag
 * @property {Shadow} shadow - the shadow service
 * @property {Number} safe - the safe block number
 * @property {API} api - darwinia substrate api
 * @property {Config} config - darwinia.js config
 */
export default class Relay {
    /**
     * Async init shadow service
     *
     * @return {Promise<Shadow>} shadow service
     */
    public static async new(): Promise<Relay> {
        const conf = new Config();
        const api = await autoAPI();

        return new Relay(api, conf);
    }

    public alive: boolean;
    public api: API;
    public port: number;
    protected config: Config;
    private _: ShadowAPI;

    constructor(api: API, config: Config) {
        this.alive = false;
        this.api = api;
        this.config = config;
        this.port = 0;
        this._ = new ShadowAPI(config.shadow);
    }

    /**
     * relay single block
     */
    public async relay(block: number) {
        const bp = isNaN(block) ?
            await this.startFromBestHeaderHash() :
            await this._.getBlockWithProof(block);
        const res = await this.api.relay(bp[0], bp[1], true);

        // to next loop
        if (!res.isOk) {
            log.ex((res as ExResult).toString());
        } else {
            log.ok(`relay eth header ${bp[0].number} succeed! 🎉`);
            log.ox(chalk.cyan.underline(
                `https://crab.subscan.io/extrinsic/${(res as ExResult).exHash}`
            ));
        }
    }

    /**
     * Start relay service
     */
    public async start(): Promise<void> {
        // stay alive
        this.alive = true;

        // keep relay
        let next = await this.startFromBestHeaderHash();
        log(`the next height is ${next[0].number}`);

        // service loop
        while (this.alive) {
            const res = await this.api.relay(next[0], next[1], true);
            // to next loop
            if (!res.isOk) {
                log.err(res.toString());
                next = await this.startFromBestHeaderHash();
            } else {
                log.ok(`relay eth header ${next[0].number} succeed!`);
                log(`current darwinia eth height is: ${next[0].number}`);
                next = await this._.getBlockWithProof(next[0].number + 1);
            }
        }
    }

    /**
     * Start relay service
     */
    public async batchStart(batch: number): Promise<void> {
        this.alive = true;
        let bps = await this.batchStartFromBestHeaderHash(batch);

        while (this.alive) {
            for (const i in bps) {
                let bp = bps[i];
                const res = await this.api.relay(bp[0], bp[1], false);
                if (!res.isOk) {
                    log.err(res.toString());
                } else {
                    log.ok(`Extrinsic relay header ${bp[0].number} is in block!`);
                }

                if (+i === (batch - 1)) {
                    bps = res.isOk ?
                        await this.batchBps(
                            bps[0][0].number + batch - 1,
                            batch,
                        ) : await this.batchStartFromBestHeaderHash(batch);
                }
            }
        }
    }

    /**
     * Forever serve
     */
    public async forever(): Promise<void> {
        await this.start().catch((e) => {
            log.err(e.toString());
            log.event("restart service in 3s...");
            setTimeout(async () => {
                await this.forever();
            }, 3000);
        });
    }

    /**
     * Forever batch serve
     */
    public async batchForever(batch: number): Promise<void> {
        await this.batchStart(batch).catch((e) => {
            log.err(e.toString());
            log.event("restart service in 3s...");
            setTimeout(async () => {
                await this.batchForever(batch);
            }, 3000);
        });
    }

    /**
     * Stop relay service
     */
    public async stop(): Promise<void> {
        this.alive = false;
    }

    private async batchBps(last: number, batch: number): Promise<BlockWithProof[]> {
        log(`fetching proofs from ${last} to ${last + batch}...`);
        let bps: BlockWithProof[] = [];
        for (let i = 1; i < batch + 1; i++) {
            bps.push(await this._.getBlockWithProof(last + i));
        }
        return bps;
    }

    /**
     * Start relay from BestHeaderHash in darwinia, this function has two
     * usages:
     *
     * - first start this process
     * - restart this process from error
     */
    private async startFromBestHeaderHash(): Promise<BlockWithProof> {
        log("start from the lastest eth header of darwinia...");
        const bestHeaderHash = await this.api._.query.ethRelay.bestHeaderHash();

        // fetch header from shadow service
        log.trace(`current best header hash is: ${bestHeaderHash.toString()}`);

        const last = await this._.getBlock(bestHeaderHash.toString());
        return await this._.getBlockWithProof((Number.parseInt(last.number as any, 16)) + 1);
    }

    /**
     * Batch Start relay from BestHeaderHash in darwinia, this function has
     * two usages:
     *
     * - first start this process
     * - restart this process from error
     */
    private async batchStartFromBestHeaderHash(batch: number): Promise<BlockWithProof[]> {
        log("start from the lastest eth header of darwinia...");
        const bestHeaderHash = await this.api._.query.ethRelay.bestHeaderHash();

        // fetch header from shadow service
        log.trace(`current best header hash is: ${bestHeaderHash.toString()}`);
        const last = Number.parseInt(
            (await this._.getBlock(bestHeaderHash.toString())).number as any,
            16
        );

        return await this.batchBps(last, batch);
    }
}
