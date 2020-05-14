export default abstract class BotDb {
    constructor() { }

    public abstract addAddr(addr: string): void;
    public abstract hasReceived(addr: string): boolean;

    public abstract nextDrop(id: number, interval: number): number;
    public abstract lastDrop(id: number, last: number): void;

    public abstract hasSupply(date: string, supply: number): boolean;
    public abstract burnSupply(date: string, supply: number): void;
}
