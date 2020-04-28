/* tslint:disable:variable-name */
import { bufferToU8a, u8aToHex } from "@polkadot/util";
import { rlp } from "ethereumjs-util";

export interface IEthBlock {
    mixHash?: string;
    nonce: string;
    parentHash: string;
    timestamp: number;
    number: number;
    miner: string;
    totalDifficulty: number;
    transactionsRoot?: string;
    sha3Uncles: string;
    extraData: string;
    stateRoot: string;
    receiptsRoot?: string;
    transactions: string[];
    uncles: string[];
    logsBloom: string;
    gasUsed: number;
    gasLimit: number;
    difficulty: number;
    seal?: string;
    size?: number;
    hash: string;
}

export interface IDarwiniaEthBlock {
    parent_hash: string;
    timestamp: number;
    number: number;
    author: string;
    transactions_root?: string;
    uncles_hash: string;
    extra_data: string;
    state_root: string;
    receipts_root?: string;
    log_bloom: string;
    gas_used: number;
    gas_limit: number;
    difficulty: number;
    seal: string[];
    hash: string;
}

/**
 * Block in Darwinia
 */
export class Block {
    /**
     * Parse EthBlock to DarwiniaEthBlock
     *
     * @param {IEthBlock} block - Ethereum block
     */
    public static parse(block: IEthBlock): IDarwiniaEthBlock {
        return Block.from(block).toJson();
    }

    /**
     * Generate Darwinia style Ethereum block from raw Ethereum block
     *
     * @param {IEthBlock} block - Ethereum block
     */
    public static from(block: IEthBlock): Block {
        let mh = block.mixHash;
        if (mh === undefined) {
            mh = "";
        }

        const mixh = bufferToU8a(rlp.encode(mh));
        const nonce = bufferToU8a(rlp.encode(block.nonce));
        const seal = [u8aToHex(mixh), u8aToHex(nonce)];

        const darwiniaBlock = new Block();
        darwiniaBlock.author = block.miner;
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
        darwiniaBlock.transactions_root = block.transactionsRoot;
        darwiniaBlock.uncles_hash = block.sha3Uncles;

        return darwiniaBlock;
    }

    public parent_hash: string;
    public timestamp: number;
    public number: number;
    public author: string;
    public transactions_root?: string;
    public uncles_hash: string;
    public extra_data: string;
    public state_root: string;
    public receipts_root?: string;
    public log_bloom: string;
    public gas_used: number;
    public gas_limit: number;
    public difficulty: number;
    public seal: string[];
    public hash: string;

    constructor() {
        this.parent_hash = "";
        this.timestamp = 0;
        this.number = 0;
        this.author = "";
        this.transactions_root = "";
        this.uncles_hash = "";
        this.extra_data = "";
        this.state_root = "";
        this.receipts_root = "";
        this.log_bloom = "";
        this.gas_used = 0;
        this.gas_limit = 0;
        this.difficulty = 0;
        this.seal = [];
        this.hash = "";
    }

    /**
     * convert darwinia block class to json
     *
     * @return {DarwiniaEthBlock} block - darwinia eth block in json
     */
    public toJson(): IDarwiniaEthBlock {
        return {
            parent_hash: this.parent_hash,
            timestamp: this.timestamp,
            number: this.number,
            author: this.author,
            transactions_root: this.transactions_root,
            uncles_hash: this.uncles_hash,
            extra_data: this.extra_data,
            state_root: this.state_root,
            receipts_root: this.receipts_root,
            log_bloom: this.log_bloom,
            gas_used: this.gas_used,
            gas_limit: this.gas_limit,
            difficulty: this.difficulty,
            seal: this.seal,
            hash: this.hash,
        };
    }

    /**
     * stringify and pretty darwinia block
     *
     * @return {String} block - darwinia block in string
     */
    public toString(): string {
        return JSON.stringify(this.toJson(), null, 2);
    }
}
