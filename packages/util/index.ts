import { Block, IEthBlock, IDarwiniaEthBlock } from "./src/block";
import { Config, TYPES_URL } from "./src/cfg";
import { download } from "./src/download";
import { log } from "./src/log";
import { whereisPj } from "./src/pj";
import { IDoubleNodeWithMerkleProof } from "./src/proof";
import chalk from "chalk";


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
    TYPES_URL,
    whereisPj,
}
