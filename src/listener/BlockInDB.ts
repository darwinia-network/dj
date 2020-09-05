

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

const blockInDB = new BlockInDB();

export { blockInDB };
