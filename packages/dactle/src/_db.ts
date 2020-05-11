import fs from "fs"
import path from "path"

/**
 * Database of bot
 */
interface IBotScheme {
    addrs: string[],
    users: Record<string, number>,
    supply: Record<string, number>,
}

/**
 * This database is just for the telegram bot currently now
 */
export class BotDb {
    private _: IBotScheme;
    private path: string;

    constructor(
        _path: string,
        supply = 0,
    ) {
        // encure the path of database
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
    public addAddr(addr: string) {
        this._.addrs.push(addr);
        this.save();
    }

    public hasReceived(addr: string) {
        if (this._.addrs.indexOf(addr) > -1) {
            return true;
        }
        return false;
    }

    /**
     * Validate user id
     */
    public nextDrop(id: string, interval: number): number {
        const last: number = this._.users[id];
        if (last !== undefined) {
            const sub = interval - ((new Date().getTime() - last) / 1000 / 60 / 60);
            return Math.floor(sub);
        }
        return 0;
    }

    public lastDrop(id: string, last: number) {
        this._.users[id] = last;
        this.save();
    }

    /**
     * Validate supply
     */
    public hasSupply(date: string): boolean {
        return this._.supply[date] > 0;
    }

    public burnSupply(date: string) {
        this._.supply[date] -= 1;
        this.save();
    }

    /**
     * save status
     */
    private save() {
        fs.writeFileSync(this.path, JSON.stringify(this._, null, 2));
    }
}

export default BotDb;
