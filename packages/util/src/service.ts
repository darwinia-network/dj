/**
 * abstract service class
 */
import { log } from "./log";
import { Config } from "./cfg";

export abstract class Service {
    public abstract port: number;
    protected abstract config: Config;

    public abstract async serve(port: number): Promise<void>;
    public abstract async start(): Promise<void>;
    public abstract async stop(): Promise<void>;

    public async forever(): Promise<void> {
        await this.start().catch((e) => {
            log.err(e.toString());
            log.event("restart service in 3s...");
            setTimeout(async () => {
                await this.forever();
            }, 3000);
        })
    }

    public async foreverServe(): Promise<void> {
        await this.serve(this.port).catch((e) => {
            log.err(e.toString());
            log.event("restart server in 3s...");
            setTimeout(async () => {
                await this.foreverServe();
            }, 3000);
        })
    }
}
