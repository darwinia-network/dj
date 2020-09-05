import web3 from "web3";

import { Blocks, blockInDB } from "./BlockInDB";
import { logInDB } from "./TransactionInDB";
import { Config } from "./Config";
import { setDelay } from "./Utils";
import { BlockchainState } from "./BlockchainState";

import { LogsOptions, Log, CoundBeNullLogs } from "./types";

export class EventParser {
  private delayBlockNumber: number = 6;
  private step: number = 300;
  private blockchainState: BlockchainState | null = null;

  start(blockchainState: BlockchainState | null) {

    if(!this.blockchainState) {
      this.blockchainState = blockchainState;
    }

    this.blockchainState && this.blockchainState.getState().then(() => {
      const blockNumber: Blocks = blockInDB.getBlockNumber();
      console.log('EventParser::starter', blockNumber);
      if (blockNumber.lastBlockNumber - blockNumber.parsedEventBlockNumber > this.delayBlockNumber) {
        this.startParseNextStepLogs(blockNumber.lastBlockNumber, blockNumber.parsedEventBlockNumber);
      } else {
        this.scheduleParsing();
      }
    })
  }

  startParseNextStepLogs(lastBlock: number, current: number) {
      let next: number= 0;

      if (lastBlock - current > this.step) {
        next = current + this.step;
      } else {
        next = lastBlock;
      }
      console.log(`EventParser::startParseNextStepLogs: parse block: [${current} - ${next})`);

      const issuingLogOptions: LogsOptions = {
        fromBlock: current,
        toBlock: next - 1,
        address: Config.contracts["ISSUING"].address,
        topics: [Config.contracts["ISSUING"].burnAndRedeemTopics]
      };

      const bankLogOptions: LogsOptions = {
        fromBlock: current,
        toBlock: next - 1,
        address: Config.contracts["BANK"].address,
        topics: [Config.contracts["BANK"].burnAndRedeemTopics]
      };

      const logs = Promise.all([this.fetchPastLogs(issuingLogOptions), this.fetchPastLogs(bankLogOptions)]);
      logs.then(([ringLog, bankLog]) => {
        if(ringLog === null || bankLog === null) {
          this.scheduleParsing();
          return;
        }

        ringLog.map(log => {
          if(log.topics.includes(web3.utils.padLeft(Config.contracts["RING"].address.toLowerCase(), 64))) {
            logInDB.afterTx('ring', [log]);
          }

          if(log.topics.includes(web3.utils.padLeft(Config.contracts["KTON"].address.toLowerCase(), 64))) {
            logInDB.afterTx('kton', [log]);
          }
        })

        bankLog.map((log: Log): void => {
          if(log.topics.includes(web3.utils.padLeft(Config.contracts["BANK"].burnAndRedeemTopics.toLowerCase(), 64))) {
            logInDB.afterTx('bank', [log]);
          }
        })
        console.log('ring', logInDB.getQueue('ring').map((item) => item.transactionHash))
        console.log('kton', logInDB.getQueue('kton').map((item) => item.transactionHash))
        console.log('bank', logInDB.getQueue('bank').map((item) => item.transactionHash))

        blockInDB.setParsedEventBlockNumber(next);
        const blockNumber: Blocks = blockInDB.getBlockNumber();
        if(blockNumber.lastBlockNumber - blockNumber.parsedEventBlockNumber > this.delayBlockNumber) {
          setDelay(5000).then(() => { this.startParseNextStepLogs(blockNumber.lastBlockNumber, blockNumber.parsedEventBlockNumber)} )
        } else {
          this.scheduleParsing();
        }
      }).catch((err: any) => {
        console.error(`startParseNextStepLogs: ${err}`);
        this.scheduleParsing();
      });
  }

  fetchPastLogs(options: LogsOptions): Promise<CoundBeNullLogs> {
    return new Promise((resolve, reject) => {
      
      Config.web3.eth.getPastLogs(options)
        .then((log:any) => {
          resolve(log);
        }).catch((err: any) => {
          console.error(`fetchPastLogs: ${err}`);
          reject(null);
        });
    })
  }

  scheduleParsing() {
    setDelay(30000).then(() => {
      this.start(this.blockchainState);
    })
  }
}