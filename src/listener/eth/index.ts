import { BlockchainState } from "./BlockchainState";
import { EventParser } from "./EventParser";
import { blockInDB, logInDB } from "./DB";
import { localConfig } from "./Config";
import { ITx } from "../../types";
import { log } from "../../util";

const blockchainState = new BlockchainState();
const eventParser = new EventParser();

export function listen(config: any, queue: ITx[]) {
    localConfig.setConfig(config);
    blockInDB.setParsedEventBlockNumber(localConfig.info.START_BLOCK_NUMBER);
    logInDB.setCallback(async (tx: string, ty: string, blockNumber: number) => {
        log.trace(`Find darwinia ${ty} tx ${tx} in block ${blockNumber}`);
        queue.push({ blockNumber, tx, ty: ty === "bank" ? "Deposit" : "Token" });
    });
    blockchainState.getState().then(() => {
        eventParser.start(blockchainState);
    })
}
