import { BlockchainState } from "./BlockchainState";
import { EventParser } from "./EventParser";

const blockchainState = new BlockchainState();
const eventParser = new EventParser();

blockchainState.getState().then(() => {
  eventParser.start(blockchainState);
})
