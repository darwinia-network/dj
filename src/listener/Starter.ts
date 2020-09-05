import { BlockchainState } from "./BlockchainState";
import { EventParser } from "./EventParser";
import { logInDB } from "./LogInDB";
import { localConfig } from "./Config";
import { blockInDB } from "./BlockInDB";

const blockchainState = new BlockchainState();
const eventParser = new EventParser();

export default class {
    start(config: any, callback: (tx: string) => void) {
        localConfig.setConfig(config);

        blockInDB.setParsedEventBlockNumber(localConfig.info.START_BLOCK_NUMBER);

        logInDB.setCallback(callback);

        blockchainState.getState().then(() => {
            eventParser.start(blockchainState);
        })
    }
}