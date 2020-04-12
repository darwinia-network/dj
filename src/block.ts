/* tslint:disable:variable-name */
import { bufferToU8a, u8aToHex } from "@polkadot/util";
import { rlp } from "ethereumjs-util";

export interface IEthBlock {
    mixHash: string;
    nonce: string | number;
    parentHash: string;
    timestamp: string | number;
    number: string | number;
    miner: string;
    totalDifficulty: string | number;
    transactionsRoot: string;
    sha3Uncles: string;
    extraData: string;
    stateRoot: string;
    receiptsRoot: string;
    transactions: string[];
    uncles: string[];
    logsBloom: string;
    gasUsed: string | number;
    gasLimit: string | number;
    difficulty: string | number;
    seal?: string;
    size?: string | number;
    hash: string;
}

export interface IDarwiniaEthBlock {
    auth: string;
    difficulty: string | number;
    extra_data: string;
    hash: string;
    gas_limit: string | number;
    gas_used: string | number;
    log_bloom: string;
    number: string | number;
    parent_hash: string;
    receipts_root: string;
    seal: string[];
    state_root: string;
    timestamp: string | number;
    transaction_root: string;
    uncles_hash: string;
}

/**
 * Block in Darwinia
 */
export class Block {
    /**
     * Generate Darwinia style Ethereum block from raw Ethereum block
     *
     * @param {IEthBlock} block - Ethereum block
     */
    public static from(block: IEthBlock): Block {
        const mixh = bufferToU8a(rlp.encode(block.mixHash));
        const nonce = bufferToU8a(rlp.encode(block.nonce));
        const seal = [u8aToHex(mixh), u8aToHex(nonce)];

        const darwiniaBlock = new Block();
        darwiniaBlock.auth = block.miner;
        darwiniaBlock.difficulty = block.difficulty;
        darwiniaBlock.extra_data = block.extraData;
        darwiniaBlock.gas_limit = block.gasLimit;
        darwiniaBlock.gas_used = block.gasUsed;
        darwiniaBlock.hash = block.hash;
        darwiniaBlock.log_bloom = block.logsBloom;
        darwiniaBlock.number = block.number;
        darwiniaBlock.parent_hash = block.parentHash;
        darwiniaBlock.receipts_root = block.receiptsRoot;
        darwiniaBlock.seal = seal;
        darwiniaBlock.state_root = block.stateRoot;
        darwiniaBlock.timestamp = block.timestamp;
        darwiniaBlock.transaction_root = block.transactionsRoot;
        darwiniaBlock.uncles_hash = block.sha3Uncles;

        return darwiniaBlock;
    }

    public auth: string;
    public difficulty: string | number;
    public extra_data: string;
    public hash: string;
    public gas_limit: string | number;
    public gas_used: string | number;
    public log_bloom: string;
    public number: string | number;
    public parent_hash: string;
    public receipts_root: string;
    public seal: string[];
    public state_root: string;
    public timestamp: string | number;
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

    /**
     * convert darwinia block class to json
     *
     * @returns {DarwiniaEthBlock} block - darwinia eth block in json
     */
    public toJson(): IDarwiniaEthBlock {
        return {
            auth: this.auth,
            difficulty: this.difficulty,
            extra_data: this.extra_data,
            gas_limit: this.gas_limit,
            gas_used: this.gas_used,
            hash: this.hash,
            log_bloom: this.log_bloom,
            number: this.number,
            parent_hash: this.parent_hash,
            receipts_root: this.receipts_root,
            seal: this.seal,
            state_root: this.state_root,
            timestamp: this.timestamp,
            transaction_root: this.transaction_root,
            uncles_hash: this.uncles_hash,
        };
    }

    /**
     * stringify and pretty darwinia block
     *
     * @returns {String} block - darwinia block in string
     */
    public toString(): string {
        return JSON.stringify(this.toJson(), null, 2);
    }
}
