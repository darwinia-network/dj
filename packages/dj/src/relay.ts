/**
 * could not re-use the relay part from /lib/relay.ts, because this
 * service need to restart manualy when error occurs instead of
 * exiting process.
 */
import Fetcher from "./fetcher";
import { Service } from "./service";
import { API, autoAPI } from "@darwinia/api";
import { BlockWithProof, Config, log } from "@darwinia/util";


/**
 * Keep relay ethereum blocks to darwinia
 *
 * @property {Boolean} alive - service alive flag
 * @property {Fetcher} fetcher - the fetcher service
 * @property {Number} safe - the safe block number
 * @property {API} api - darwinia substrate api
 * @property {Config} config - darwinia.js config
 */
export default class Relay extends Service {
    /**
     * Async init fetcher service
     *
     * @return {Promise<Fetcher>} fetcher service
     */
    public static async new(): Promise<Relay> {
        const api = await autoAPI();
        const conf = new Config();
        const fetcher = await Fetcher.new();

        return new Relay(api, conf, fetcher);
    }

    public alive: boolean;
    public api: API;
    public fetcher: Fetcher;
    public port: number;
    protected config: Config;
    private safe: number;

    constructor(api: API, config: Config, fetcher: Fetcher) {
        super();
        this.alive = false;
        this.api = api;
        this.config = config;
        this.fetcher = fetcher;
        this.port = 0;
        this.safe = 7;
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

        // set safe block, if it is zero use lucky 7 or safe * 2 in darwinia
        const safe = await this.api._.query.ethRelay.numberOfBlocksSafe();
        const n = Number(safe.toString());
        if (n !== 0) {
            this.safe = n * 2;
        }

        // keep relay
        let next = await this.startFromBestHeaderHash();
        log.trace(`the next height is ${next[0].number}`);

        // service loop
        while (this.alive) {
            await this.shouldStopFetcher((next[0].number as number));
            const res = await this.api.relay(next[0], next[1], true);

            // to next loop
            if (!res.isOk) {
                log.err(res.toString());
                next = await this.startFromBestHeaderHash();
            } else {
                log.ok(`relay eth header ${next[0].number} succeed!`);
                log.trace(`current darwinia eth height is:             ${next[0].number}`);
                log.trace(`current the max height of local storage is: ${this.fetcher.max}`);
                next = await this.fetcher.getBlock((next[0].number as number) + 1);
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
     * Infer if we should stop fetcher
     */
    private async shouldStopFetcher(n: number): Promise<void> {
        if (
            (this.fetcher.max >= this.safe + n) && this.fetcher.status()
        ) {
            log.event("fetcher - stop");
            await this.fetcher.stop();
        } else if (
            (this.fetcher.max < this.safe + n) && !this.fetcher.status()
        ) {
            log.event("fetcher - start");
            if (!this.fetcher.status()) {
                this.fetcher.start(n);
            }
        }
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
        const last = await this.fetcher.web3._.eth.getBlock(bestHeaderHash.toString());
        return await this.fetcher.getBlock((last.number as number) + 1);
    }
}
