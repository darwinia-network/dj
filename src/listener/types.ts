import { BlockNumber, Log } from "web3-core";

export * from 'web3-core';

export type Topics = (string | string[] | null)[];

export interface LogsOptions {
    fromBlock: BlockNumber;
    toBlock: BlockNumber;
    address: string | string[];
    topics: (string | string[] | null)[];
}

export type CoundBeNullLogs = null | Log[];

export type LogType = 'ring' | 'kton' | 'bank';