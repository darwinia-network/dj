import { IEthereumHeaderThingWithProof, ITx } from "./types";

/**
 * Memory database for relay process
 */
class Cache {
    public blocks: IEthereumHeaderThingWithProof[] = [];
    public txs: ITx[] = [];
    public outdateTxs: ITx[] = [];

    /**
     * Get block with proof from cache
     */
    getBlock(n: number): IEthereumHeaderThingWithProof | null {
        for (const b of this.blocks) {
            if (b.header.number === n) {
                return b;
            }
        }

        return null;
    }

    /**
     * Set block with proof into cache
     */
    setBlock(headerThing: IEthereumHeaderThingWithProof) {
        this.blocks.push(headerThing);
        return;
    }

    /**
     * Push tx into cache
     */
    pushTx(tx: ITx) {
        this.txs.push(tx);
    }

    /**
     * Get the highest tx
     */
    supTx(): number {
        const blocks = this.txs.sort(
            (p, q) => q.blockNumber - p.blockNumber,
        );

        if (!blocks || blocks.length === 0) {
            return 0;
        }
        return blocks[0].blockNumber;
    }

    /**
     * Slice transactions
     */
    trimTxs(block: number): ITx[] {
        const txs = this.txs.filter((t) => t.blockNumber < block);
        this.txs = this.txs.filter((t) => t.blockNumber >= block)
        return txs;
    }

    /**
     * Check if a tx has been redeemed
     */
    redeemAble(tx: ITx): boolean {
        for (const t of this.outdateTxs) {
            if (t === tx) {
                return false;
            }
        }
        return true;
    }
}

const cache = new Cache();
export default cache;
