import { LogType, Log } from "./types";

export class LogInDB {
    private ringQueue: Log[] = [];
    private ktonQueue: Log[] = [];
    private bankQueue: Log[] = [];
    // @ts-nocheck
    private callback: (tx: string, type: LogType) => void = () => undefined;

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
    // getTx(type: LogType, acount: number): Log[] {

    // }

    afterTx(type: LogType, logs: Log[]) {
        this.getQueue(type).push(...logs);
        logs.map((log) => {
            this.callback(log.transactionHash, type);
        })
    }

    setCallback(callback: (tx: string, type: LogType) => void) {
        this.callback = callback;
    }
}

const logInDB = new LogInDB();

export { logInDB };
