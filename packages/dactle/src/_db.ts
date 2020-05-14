export default abstract class BotDb {
    public abstract async addAddr(addr: string): Promise<void>;
    public abstract async hasReceived(addr: string): Promise<boolean>;
    public abstract async nextDrop(id: number, interval: number): Promise<number>;
    public abstract async lastDrop(id: number, last: number): Promise<void>;
    public abstract async hasSupply(date: string, supply: number): Promise<boolean>;
    public abstract async burnSupply(date: string, supply: number): Promise<void>;
}
