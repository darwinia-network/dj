/**
 * could not re-use the relay part from /lib/relay.ts, because this
 * service need to restart manualy when error occurs instead of
 * exiting process.
 */
import { Service } from "./service";
import { API, autoAPI, ShadowAPI } from "@darwinia/api";
import { BlockWithProof, Config, log } from "@darwinia/util";

/**
 * Keep relay ethereum blocks to darwinia
 *
 * @property {Boolean} alive - service alive flag
 * @property {Shadow} shadow - the shadow service
 * @property {Number} safe - the safe block number
 * @property {API} api - darwinia substrate api
 * @property {Config} config - darwinia.js config
 */
export default class Relay extends Service {
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
        super();
        this.alive = false;
        this.api = api;
        this.config = config;
        this.port = NaN;
        this._ = new ShadowAPI(config.shadow);
    }

    /**
     * @deprecated no need to serve
     */
    public async serve(port: number): Promise<void> {
        log.warn(`the expect port is ${port}, the server of relay is not completed`);
        await this.start();
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
     * Stop relay service
     */
    public async stop(): Promise<void> {
        this.alive = false;
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
}
