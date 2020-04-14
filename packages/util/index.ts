import { Block, IEthBlock, IDarwiniaEthBlock } from "./src/block";
import { Config } from "./src/cfg";
import { download } from "./src/download";
import { log } from "./src/log";
import { whereisPj } from "./src/pj";

// constants
const TYPES_URL = "https://raw.githubusercontent.com/darwinia-network/darwinia/master/runtime/crab/types.json"

// exports
export {
    Block,
    Config,
    download,
    IDarwiniaEthBlock, IEthBlock,
    log,
    TYPES_URL,
    whereisPj,
}
