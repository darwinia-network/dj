import { Block, IEthBlock, IDarwiniaEthBlock } from "./src/block";
import { Config, TYPES_URL } from "./src/cfg";
import { download } from "./src/download";
import { log } from "./src/log";
import { whereisPj } from "./src/pj";
import chalk from "chalk";

/**
 * types
 */
interface IDoubleNodeWithMerkleProof {
    dag_nodes: string[],
    proof: string[],
}

interface IReceiptWithProof {
    header: IDarwiniaEthBlock,
    receipt_proof: string,
    mmr_proof: string[],
}

interface IProposalHeader {
    eth_header: IDarwiniaEthBlock,
    ethash_proof: IDoubleNodeWithMerkleProof[],
    mmr_root: string,
    mmr_proof: string[]
}

interface IProposalHeaders {
    headers: IProposalHeader[],
}

type BlockWithProof = [IDarwiniaEthBlock, IDoubleNodeWithMerkleProof[]];

// exports
export {
    Block,
    BlockWithProof,
    Config,
    chalk,
    IDoubleNodeWithMerkleProof,
    IReceiptWithProof,
    IProposalHeaders,
    download,
    IDarwiniaEthBlock, IEthBlock,
    log,
    TYPES_URL,
    whereisPj,
}
