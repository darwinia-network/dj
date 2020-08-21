/**
 * The is a shadow command
 */
import { API, autoAPI, ShadowAPI, ExResult, BlockWithProof } from "@darwinia/api";
import { Config, chalk, log } from "@darwinia/util";

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
    private lastRelayTime: number;

    constructor(api: API, config: Config) {
        this.alive = false;
        this.api = api;
        this.config = config;
        this.port = 0;
        this._ = new ShadowAPI(config.shadow);
        this.lastRelayTime = + new Date().getTime();
    }

    /**
     * relay single block
     */
    public async relay(block = 1) {
        const bp = await this._.getBlockWithProof(block);
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
    public async start(batch = 1): Promise<void> {
        this.alive = true;
        let bps = await this.batchStartFromBestHeaderHash(batch);
        while (this.alive) {
            for (let i = 0; i < bps.length; i++) {
                const bp = bps[i];
                const res = await this.api.relay(bp[0], bp[1], false);
                if (!res.isOk) {
                    log.err(`Last relay time: ${new Date(this.lastRelayTime)}`);
                    continue;
                } else {
                    this.lastRelayTime = + new Date().getTime();
                    log.trace(`Current time: ${new Date(this.lastRelayTime)}`);
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
     * Forever batch serve
     */
    public async forever(batch: number) {
        const that = this;
        return new Promise(async (_, reject) => {
            // The wathcer
            const interval = setInterval(() => {
                const now = + new Date().getTime();
                log.trace(`From last relay: ${(now - that.lastRelayTime) / 1000}s`);
                if ((now - that.lastRelayTime) > 60 * 1000) {
                    log.event("Relay service has been stuck for 60s, trying to retsart...");
                    clearInterval(interval);
                    reject("Trigger start");
                }
            }, 3000);

            log("starting relay service...");
            await this.start(batch).catch((e) => {
                that.lastRelayTime = + new Date().getTime();
                log.err(e);
                log.event("restart service in 3s...");
                setTimeout(async () => {
                    await that.forever(batch)
                }, 3000);
            });
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
        const bps: BlockWithProof[] = await this._.batchBlockWithProofByNumber(last + 1, batch);
        return bps;
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
