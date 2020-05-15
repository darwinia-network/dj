import Redis from "ioredis";
import BotDb from "./schema";

/// Table
const USER = "_users"
const ADDRS = "_addrs"
const SUPPLY = "_supply"

export class RDb extends BotDb {
    public _: Redis.Redis;

    constructor(port = 6379, host = "0.0.0.0") {
        super();
        this._ = new Redis(port, host);
    }

    public async addAddr(addr: string): Promise<void> {
        await this._.sadd(ADDRS, addr);
    }

    public async hasReceived(addr: string): Promise<boolean> {
        const res: number = await this._.sismember(ADDRS, addr);
        if (res === 0) {
            return false
        }

        return true;
    }

    public async nextDrop(id: number, interval: number): Promise<number> {
        const last: string | null = await this._.hget(USER, id.toString());
        if (last) {
            const lastTime = Number.parseInt(last, 10);
            const sub = interval - ((new Date().getTime() - lastTime) / 1000 / 60 / 60);
            return Math.floor(sub);
        }
        return 0;
    }

    public async lastDrop(id: number, last: number): Promise<void> {
        await this._.hmset(USER, [id, last]);
    }

    public async hasSupply(date: string, supply: number): Promise<boolean> {
        const cs = await this._.hget(SUPPLY, date);
        if (cs) {
            return Number.parseInt(cs, 10) > 0;
        } else {
            await this._.hmset(SUPPLY, [date, supply]);
            return true;
        }
    }

    public async burnSupply(date: string, supply: number): Promise<void> {
        const current = await this._.hget(SUPPLY, date);
        if (current) {
            await this._.hmset(SUPPLY, [date, (Number.parseInt(current, 10) - 1)]);
        } else {
            this._.hmset(SUPPLY, [date, supply]);
        }
    }
}

export default RDb;
