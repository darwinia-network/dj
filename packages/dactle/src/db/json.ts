import fs from "fs"
import path from "path"
import BotDb from "./schema";

/**
 * Database of bot
 */
export interface IBotScheme {
    addrs: string[],
    users: Record<number, number>,
    supply: Record<string, number>,
}

/**
 * This database is just for the telegram bot currently now
 */
export class JDb extends BotDb {
    private _: IBotScheme;
    private path: string;

    constructor(
        _path: string,
        supply = 0,
    ) {
        super();
        // ensure the path of database
        if (!fs.existsSync(_path)) {
            fs.mkdirSync(path.dirname(_path), { recursive: true });
            fs.writeFileSync(_path, "");
            this._ = {
                addrs: [],
                users: {},
                supply: {
                    [new Date().toJSON().slice(0, 10)]: supply,
                },
            };
        } else {
            this._ = JSON.parse(fs.readFileSync(_path).toString());
        }

        this.path = _path;
    }

    /**
     * Validate address
     */
    public async addAddr(addr: string) {
        this._.addrs.push(addr);
        this.save();
    }

    public async hasReceived(addr: string): Promise<boolean> {
        if (this._.addrs.indexOf(addr) > -1) {
            return true;
        }
        return false;
    }

    /**
     * Validate user id
     */
    public async nextDrop(id: number, interval: number): Promise<number> {
        const last: number = this._.users[id];
        if (last !== undefined) {
            const sub = interval - ((new Date().getTime() - last) / 1000 / 60 / 60);
            return Math.floor(sub);
        }
        return 0;
    }

    public async lastDrop(id: number, last: number) {
        this._.users[id] = last;
        this.save();
    }

    /**
     * Validate supply
     */
    public async hasSupply(date: string, supply: number): Promise<boolean> {
        this.fillSupply(date, supply);
        return this._.supply[date] > 0;
    }

    public async burnSupply(date: string, supply: number): Promise<void> {
        this.fillSupply(date, supply);
        this._.supply[date] -= 1;
        this.save();
    }

    /**
     * save status
     */
    private save() {
        fs.writeFileSync(this.path, JSON.stringify(this._, null, 2));
    }

    private fillSupply(date: string, supply: number) {
        if (this._.supply[date] === undefined) {
            this._.supply[date] = supply;
            this.save();
        }
    }
}

export default JDb;
