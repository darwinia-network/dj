import EWeb3 from "web3";
import { Block, IDarwiniaEthBlock, IEthBlock, log } from "@darwinia/util";

/**
 * @class Web3 - web3 api wrapper
 *
 * @method getBlock - transfer ring
 *
 * @property {Web3} web3 - raw web3 api
 */
export class Web3 {
    public _: EWeb3;

    /**
     * init web3 api
     *
     * @param {String} web3 - web3 api http address
     * @param {AddedAccount} priv - private key of ethereum account
     */
    constructor(node: string, priv: string) {
        this._ = new EWeb3(new EWeb3.providers.HttpProvider(node));
        if (priv.length > 0) {
            this._.eth.accounts.wallet.add(priv);
        }
    }

    /**
     * get block by hash | height
     *
     * @param {String | Number} block - the target block
     */
    public async getBlock(block: string | number): Promise<IDarwiniaEthBlock> {
        log.trace(`fetch block ${block} from ethereum...`);
        const web3EthBlock = await this._.eth.getBlock(block);
        const eBlock: IEthBlock = {
            mixHash: (web3EthBlock as any).mixHash ? (web3EthBlock as any).mixHash : "",
            nonce: web3EthBlock.nonce,
            parentHash: web3EthBlock.parentHash,
            timestamp: Number(web3EthBlock.timestamp),
            number: web3EthBlock.number,
            miner: web3EthBlock.miner,
            totalDifficulty: Number(web3EthBlock.totalDifficulty),
            transactionsRoot: (web3EthBlock as any).transactionsRoot,
            sha3Uncles: web3EthBlock.sha3Uncles,
            extraData: web3EthBlock.extraData,
            stateRoot: web3EthBlock.stateRoot,
            receiptsRoot: (web3EthBlock as any).receiptsRoot,
            transactions: web3EthBlock.transactions,
            uncles: web3EthBlock.uncles,
            logsBloom: web3EthBlock.logsBloom,
            gasUsed: web3EthBlock.gasUsed,
            gasLimit: web3EthBlock.gasLimit,
            difficulty: web3EthBlock.difficulty,
            hash: web3EthBlock.hash,
        }
        return Block.parse(eBlock);
    }
}
