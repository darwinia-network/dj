/* tslint:disable:variable-name */
import { bufferToU8a, u8aToHex } from "@polkadot/util";
import { rlp } from "ethereumjs-util";

interface EthBlock {
    mixHash: string;
    nonce: string;
    parentHash: string;
    timestamp: number;
    number: number;
    miner: string;
    transactionsRoot: string;
    sha3Uncles: string;
    extraData: string;
    stateRoot: string;
    receiptsRoot: string;
    logsBloom: string;
    gasUsed: string;
    gasLimit: string;
    difficulty: number;
    seal: string;
    hash: string;
}

/**
 * Block in Darwinia.
 */
class Block {
    public static from(block: EthBlock): Block {
        const mixh = bufferToU8a(rlp.encode(block.mixHash));
        const nonce = bufferToU8a(rlp.encode(block.nonce));
        const seal = [u8aToHex(mixh), u8aToHex(nonce)];

        return {
            auth: block.miner,
            difficulty: block.difficulty,
            extra_data: block.extraData,
            gas_limit: block.gasLimit,
            gas_used: block.gasUsed,
            hash: block.hash,
            log_bloom: block.logsBloom,
            number: block.number,
            parent_hash: block.parentHash,
            receipts_root: block.receiptsRoot,
            seal,
            state_root: block.stateRoot,
            timestamp: block.timestamp,
            transaction_root: block.transactionsRoot,
            uncles_hash: block.sha3Uncles,
        };
    }

    public auth: string;
    public difficulty: number;
    public extra_data: string;
    public hash: string;
    public gas_limit: string;
    public gas_used: string;
    public log_bloom: string;
    public number: number;
    public parent_hash: string;
    public receipts_root: string;
    public seal: string[];
    public state_root: string;
    public timestamp: number;
    public transaction_root: string;
    public uncles_hash: string;

    constructor() {
        this.auth = "";
        this.difficulty = 0;
        this.extra_data = "";
        this.hash = "";
        this.gas_limit = "";
        this.gas_used = "";
        this.log_bloom = "";
        this.number = 0;
        this.parent_hash = "";
        this.receipts_root = "";
        this.seal = [];
        this.state_root = "";
        this.timestamp = 0;
        this.transaction_root = "";
        this.uncles_hash = "";
    }
}

export default Block;

