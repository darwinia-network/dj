import { LogType, Log } from "../../types";

type CallBack = (
    tx: string,
    type: LogType,
    blockNumber: number,
    redeemAble: [string, number],
) => void;

export interface Blocks {
    lastBlockNumber: number,
    parsedEventBlockNumber: number
}

export class BlockInDB {
    private lastBlockNumber: number = 0;
    private parsedEventBlockNumber: number = 0;

    setLastBlockNumber(num: number): void {
        this.lastBlockNumber = num;
    }

    setParsedEventBlockNumber(num: number): void {
        this.parsedEventBlockNumber = num;
    }

    getBlockNumber(): Blocks {
        return {
            lastBlockNumber: this.lastBlockNumber,
            parsedEventBlockNumber: this.parsedEventBlockNumber
        };
    }
}

export class LogInDB {
    private ringQueue: Log[] = [];
    private ktonQueue: Log[] = [];
    private bankQueue: Log[] = [];
    // @ts-nocheck
    private callback: CallBack = () => undefined;

    getQueue(type: LogType): Log[] {
        switch (type) {
            case 'ring':
                return this.ringQueue;
            case 'kton':
                return this.ktonQueue;
            case 'bank':
                return this.bankQueue;
        }
    }

    afterTx(type: LogType, l: Log) {
        this.getQueue(type).push(l);
        this.callback(
            l.transactionHash,
            type,
            l.blockNumber,
            [l.blockHash, l.transactionIndex],
        );
    }

    setCallback(callback: CallBack) {
        this.callback = callback;
    }
}

const blockInDB = new BlockInDB();
const logInDB = new LogInDB();

export { blockInDB, logInDB };
