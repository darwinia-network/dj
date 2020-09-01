import { IDarwiniaEthBlock } from "../../util";

/// EthashProof Interface
export interface IDoubleNodeWithMerkleProof {
    dag_nodes: string[],
    proof: string[],
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

export type BlockWithProof = [IDarwiniaEthBlock, IDoubleNodeWithMerkleProof[], string];

/// EthHeaderThing Interface
export interface IEthHeaderThing {
    header: IDarwiniaEthBlock,
    ethash_proof: IDoubleNodeWithMerkleProof[],
    mmr_root: string,
    mmr_proof: string[],
}
