import { BlockchainState } from "./BlockchainState";
import { EventParser } from "./EventParser";
import { blockInDB, logInDB } from "./DB";
import { localConfig } from "./Config";
import { log } from "../../util";
import Cache from "../cache";

const blockchainState = new BlockchainState();
const eventParser = new EventParser();

export function listen(config: any) {
    localConfig.setConfig(config);
    blockInDB.setParsedEventBlockNumber(localConfig.info.START_BLOCK_NUMBER);
    logInDB.setCallback(async (
        tx: string,
        ty: string,
        blockNumber: number,
        redeemAble: [string, number],
    ) => {
        log(`Found darwinia ${ty} tx ${tx} in block ${blockNumber}`);
        Cache.pushTx({
            blockNumber,
            tx,
            ty: ty === "bank" ? "Deposit" : "Token",
            redeemAble,
        });
    });

    blockchainState.getState().then(() => {
        eventParser.start(blockchainState);
    });
}
