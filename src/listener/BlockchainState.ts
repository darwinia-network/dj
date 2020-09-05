import { Config } from "./Config";
import { blockInDB } from "./BlockInDB";

export class BlockchainState {
  getState(): Promise<any> {
    return BlockchainState.getBlockState().then(([blockInChain, latestBlockInDB]) => {
      blockInDB.setLastBlockNumber(blockInChain);
    })
  }

  static getBlockState(): Promise<any[]> {
    const latestBlockOnChain = Config.web3.eth.getBlockNumber();
    const latestBlockInDB = blockInDB.getBlockNumber();
    return Promise.all([latestBlockOnChain, latestBlockInDB]);
  }
}