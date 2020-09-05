import { LogType, Log } from "./types";

export class LogInDB {
  private ringQueue: Log[] = [];
  private ktonQueue: Log[] = [];
  private bankQueue: Log[] = [];

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

  afterTx(type: LogType, tx: Log[]) {
    this.getQueue(type).push(...tx);
  }
}

let logInDB = new LogInDB();

export { logInDB };
