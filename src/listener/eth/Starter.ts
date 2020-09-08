import { BlockchainState } from "./BlockchainState";
import { EventParser } from "./EventParser";
import { blockInDB, logInDB } from "./DB";
import { localConfig } from "./Config";
import { LogType } from "./types";

const blockchainState = new BlockchainState();
const eventParser = new EventParser();

export default class {
    start(config: any, callback: (tx: string, type: LogType) => void) {
        localConfig.setConfig(config);
        blockInDB.setParsedEventBlockNumber(localConfig.info.START_BLOCK_NUMBER);
        logInDB.setCallback(callback);
        blockchainState.getState().then(() => {
            eventParser.start(blockchainState);
        })
    }
}
