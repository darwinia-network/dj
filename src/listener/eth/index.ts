import { BlockchainState } from "./BlockchainState";
import { EventParser } from "./EventParser";
import { blockInDB, logInDB } from "./DB";
import { localConfig } from "./Config";
import { LogType } from "./types";

const blockchainState = new BlockchainState();
const eventParser = new EventParser();

export function listen(config: any, callback: (
    tx: string, type: LogType, blockNumber: number,
) => void) {
    localConfig.setConfig(config);
    blockInDB.setParsedEventBlockNumber(localConfig.info.START_BLOCK_NUMBER);
    logInDB.setCallback(callback);
    blockchainState.getState().then(() => {
        eventParser.start(blockchainState);
    })
}
