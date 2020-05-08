import { Block, IEthBlock, IDarwiniaEthBlock } from "./src/block";
import { Config, TYPES_URL } from "./src/cfg";
import { download } from "./src/download";
import { log } from "./src/log";
import { whereisPj } from "./src/pj";
import { Service } from "./src/service";
import chalk from "chalk";

/**
 * types
 */
interface IDoubleNodeWithMerkleProof {
    dag_nodes: string[],
    proof: string[],
}

type BlockWithProof = [IDarwiniaEthBlock, IDoubleNodeWithMerkleProof[]];

// exports
export {
    Block,
    BlockWithProof,
    Config,
    chalk,
    IDoubleNodeWithMerkleProof,
    download,
    IDarwiniaEthBlock, IEthBlock,
    log,
    Service,
    TYPES_URL,
    whereisPj,
}
