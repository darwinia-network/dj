/// Web3 types
import { BlockNumber, Log } from "web3-core";

export { Log } from 'web3-core';
export type Topics = (string | string[] | null)[];
export interface LogsOptions {
    fromBlock: BlockNumber;
    toBlock: BlockNumber;
    address: string | string[];
    topics: (string | string[] | null)[];
}

export type CoundBeNullLogs = null | Log[];
export type LogType = 'ring' | 'kton' | 'bank';

/// Transaction stuffs
export interface ITx {
    tx: string,
    ty: string,
    blockNumber: number,
    redeemAble: [string, number],
}

/// Darwinia Block
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

/// EthashProof Interface
export interface IDoubleNodeWithMerkleProof {
    dag_nodes: string[],
    proof: string[],
}

/// Receipt interface
export interface IReceipt {
    index: string;
    proof: string;
    header_hash: string;
}

/// Receipt Proof Interface
export interface IReceiptWithProof {
    header: IDarwiniaEthBlock,
    receipt_proof: IReceipt,
    mmr_proof: IMMRProof,
}

export interface IMMRProof {
    member_leaf_index: number,
    last_leaf_index: number,
    proof: string[]
}

/// Proposal Header Interface
export interface IProposalHeader {
    eth_header: IDarwiniaEthBlock,
    ethash_proof: IDoubleNodeWithMerkleProof[],
    mmr_root: string,
    mmr_proof: string[],
}

// Proposal Headers Interface
export interface IProposalHeaders {
    headers: IProposalHeader[],
}

export interface IEthereumHeaderThing {
    header: IDarwiniaEthBlock,
    mmr_root: string,
}

export interface IEthereumHeaderThingWithConfirmation {
    header_thing: IEthereumHeaderThing,
    confirmation: number,
}

/// EthHeaderThing Interface
export interface IEthereumHeaderThingWithProof {
    header: IDarwiniaEthBlock,
    ethash_proof: IDoubleNodeWithMerkleProof[],
    mmr_root: string,
    mmr_proof: string[],
}
