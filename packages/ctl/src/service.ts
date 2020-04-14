/**
 * abstract service class
 */
import { Config } from "@darwinia/util";

abstract class Service {
    protected abstract config: Config;

    public abstract async start(): Promise<void>;
    public abstract async stop(): Promise<void>;
}

export default Service;
