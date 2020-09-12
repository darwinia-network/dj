import web3 from "web3";
import { Blocks, blockInDB, logInDB } from "./DB";
import { localConfig as Config } from "./Config";
import { delay, log } from "../../util";
import { BlockchainState } from "./BlockchainState";
import { LogsOptions, Log, CoundBeNullLogs } from "../../types";

export class EventParser {
    private delayBlockNumber: number = 6;
    private step: number = 300;
    private blockchainState: BlockchainState | null = null;

    start(blockchainState: BlockchainState | null) {
        if (!this.blockchainState) {
            this.blockchainState = blockchainState;
        }

        this.blockchainState?.getState().then(() => {
            const blockNumber: Blocks = blockInDB.getBlockNumber();
            log.trace(`EventParser::starter ${JSON.stringify(blockNumber)}`);
            if (blockNumber.lastBlockNumber - blockNumber.parsedEventBlockNumber > this.delayBlockNumber) {
                this.startParseNextStepLogs(
                    blockNumber.lastBlockNumber,
                    blockNumber.parsedEventBlockNumber,
                );
            } else {
                this.scheduleParsing();
            }
        })
    }

    startParseNextStepLogs(lastBlock: number, current: number) {
        let next: number = 0;
        if (lastBlock - current > this.step) {
            next = current + this.step;
        } else {
            next = lastBlock;
        }

        log.trace(`EventParser::startParseNextStepLogs: parse block: [${current} - ${next})`);
        const issuingLogOptions: LogsOptions = {
            fromBlock: current,
            toBlock: next - 1,
            address: Config.contracts.ISSUING.address,
            topics: [Config.contracts.ISSUING.burnAndRedeemTopics]
        };

        const bankLogOptions: LogsOptions = {
            fromBlock: current,
            toBlock: next - 1,
            address: Config.contracts.BANK.address,
            topics: [Config.contracts.BANK.burnAndRedeemTopics]
        };

        const logs = Promise.all([
            this.fetchPastLogs(issuingLogOptions),
            this.fetchPastLogs(bankLogOptions),
        ]);
        logs.then(([ringLog, bankLog]) => {
            if (ringLog === null || bankLog === null) {
                this.scheduleParsing();
                return;
            }

            ringLog.map(l => {
                if (l.topics.includes(
                    web3.utils.padLeft(Config.contracts.RING.address.toLowerCase(), 64)
                )) {
                    logInDB.afterTx('ring', [l], l.blockNumber);
                }

                if (l.topics.includes(
                    web3.utils.padLeft(Config.contracts.KTON.address.toLowerCase(), 64)
                )) {
                    logInDB.afterTx('kton', [l], l.blockNumber);
                }
            })

            bankLog.map((l: Log): void => {
                if (l.topics.includes(
                    web3.utils.padLeft(Config.contracts.BANK.burnAndRedeemTopics.toLowerCase(), 64)
                )) {
                    logInDB.afterTx('bank', [l], l.blockNumber);
                }
            })

            blockInDB.setParsedEventBlockNumber(next);
            const blockNumber: Blocks = blockInDB.getBlockNumber();
            if (blockNumber.lastBlockNumber - blockNumber.parsedEventBlockNumber > this.delayBlockNumber) {
                delay(5000).then(() => {
                    this.startParseNextStepLogs(
                        blockNumber.lastBlockNumber,
                        blockNumber.parsedEventBlockNumber,
                    )
                })
            } else {
                this.scheduleParsing();
            }
        }).catch((err: any) => {
            log.err(`startParseNextStepLogs: ${err}`);
            this.scheduleParsing();
        });
    }

    fetchPastLogs(options: LogsOptions): Promise<CoundBeNullLogs> {
        return new Promise((resolve, reject) => {
            Config.web3.eth.getPastLogs(options)
                .then((l: any) => {
                    resolve(l);
                }).catch((err: any) => {
                    log.err(`fetchPastLogs: ${err}`);
                    reject(null);
                });
        })
    }

    scheduleParsing() {
        delay(30000).then(() => {
            this.start(this.blockchainState);
        })
    }
}
