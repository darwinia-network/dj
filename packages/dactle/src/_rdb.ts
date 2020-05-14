import Redis from "ioredis";
import BotDb from "./_db";

/// Table
const USER = "_user"
const ADDRS = "_addrs"
const SUPPLY = "_supply"

export class RDb extends BotDb {
    private db: Redis.Redis;

    constructor() {
        super();
        this.db = new Redis();
    }

    public async addAddr(addr: string): Promise<void> {
        await this.db.sadd(ADDRS, addr);
    }

    public async hasReceived(addr: string): Promise<boolean> {
        if (await this.db.sismember(ADDRS, addr) === 0) {
            return false
        }

        return true;
    }

    public async nextDrop(id: number, interval: number): Promise<number> {
        const key = this.expand(USER, "" + id);
        const last = await this.db.get(key);
        if (last) {
            const lastTime = Number.parseInt(last, 10)
            const sub = interval - ((new Date().getTime() - lastTime) / 1000 / 60 / 60);
            return Math.floor(sub);
        }
        return 0;
    }

    public async lastDrop(id: number, last: number): Promise<void> {
        const key = this.expand(USER, "" + id);
        await this.db.set(key, last);
    }

    public async hasSupply(date: string, supply: number): Promise<boolean> {
        const key = this.expand(SUPPLY, date);
        const cs = await this.fillSupply(key, supply)
        return cs > 0;
    }

    public async burnSupply(date: string, supply: number): Promise<void> {
        const key = this.expand(SUPPLY, date);
        const cs = await this.fillSupply(key, supply)
        this.db.set(key, cs - 1);
    }

    private async fillSupply(key: string, supply: number): Promise<number> {
        let currentSupply: number = 0;
        const s = await this.db.get(key);
        if (!s) {
            this.db.set(key, supply);
            currentSupply = supply;
        } else {
            currentSupply = Number.parseInt(s, 10)
        }

        return Number(currentSupply);
    }

    /**
     * @param {string} key - key name
     * @param {string} radix - radix value
     */
    private expand(key: string, radix: string): string {
        return `${key}_${radix}`;
    }
}
