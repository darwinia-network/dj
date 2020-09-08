/// Transaction stuffs
export interface ITx {
    tx: string,
    ty: string,
    relayedBlock: number,
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
    receipt_proof: string,
    mmr_proof: string[],
}

/// Proposal Header Interface
export interface IProposalHeader {
    eth_header: IDarwiniaEthBlock,
    ethash_proof: IDoubleNodeWithMerkleProof[],
    mmr_root: string,
    mmr_proof: string[]
}

// Proposal Headers Interface
export interface IProposalHeaders {
    headers: IProposalHeader[],
}

export interface IEthereumHeaderThing {
    header: IDarwiniaEthBlock,
    mmr_root: string,
}

/// EthHeaderThing Interface
export interface IEthereumHeaderThingWithProof {
    header: IDarwiniaEthBlock,
    ethash_proof: IDoubleNodeWithMerkleProof[],
    mmr_root: string,
    mmr_proof: string[],
}
