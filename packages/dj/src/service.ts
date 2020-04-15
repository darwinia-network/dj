/**
 * abstract service class
 */
import { Config, log } from "@darwinia/util";

export abstract class Service {
    protected abstract config: Config;

    public abstract async start(): Promise<void>;
    public abstract async stop(): Promise<void>;

    public async forever(): Promise<void> {
        await this.start().catch((e) => {
            log.err(e.toString());
            log.event("restart serrvce in 3s...");
            setTimeout(async () => {
                await this.forever();
            }, 3000);
        })
    }
}

/**
 * Keep service alive
 *
 * @param {Service} s - service
 */
export async function forever(s: Service): Promise<void> {
    await s.start().catch((e) => {
        log.err(e.toString());
        log.event("restart serrvce in 3s...");
        setTimeout(async () => {
            await forever(s);
        }, 3000);
    })
}

