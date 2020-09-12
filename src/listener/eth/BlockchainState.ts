import { localConfig as Config } from "./Config";
import { blockInDB } from "./DB";

export class BlockchainState {
    async getState(): Promise<any> {
        return BlockchainState.getBlockState().then(([blockInChain, _latestBlockInDB]) => {
            blockInDB.setLastBlockNumber(blockInChain);
        })
    }

    static getBlockState(): Promise<any[]> {
        const latestBlockOnChain = Config.web3.eth.getBlockNumber();
        const latestBlockInDB = blockInDB.getBlockNumber();
        return Promise.all([latestBlockOnChain, latestBlockInDB]);
    }
}
