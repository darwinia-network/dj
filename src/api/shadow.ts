/* tslint:disable:variable-name */
import axios, { AxiosResponse } from "axios";
import {
    log, Block, IDarwiniaEthBlock,
} from "../util";
import {
    IReceiptWithProof,
    IEthereumHeaderThing,
    IEthereumHeaderThingWithProof,
} from "./types/block";

/**
 * Shadow APIs
 *
 * @method getBlock - get raw eth block
 * @method getBlockWithProof - get eth header with proof
 */
export class ShadowAPI {
    private api: string;

    constructor(api: string) {
        this.api = api;
    }

    /**
     * Get raw darwinia block
     *
     * @param {number} block - block number
     */
    public async getBlock(block: number | string): Promise<IDarwiniaEthBlock> {
        let r: AxiosResponse;
        r = await axios.get(this.api + "/eth/header/" + block);

        // Trace the back data
        log.trace(JSON.stringify(r.data.header, null, 2));
        return r.data.header;
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     */
    async getHeaderThing(block: number | string): Promise<IEthereumHeaderThing> {
        const r: AxiosResponse = await axios.get(
            this.api + "/eth/header/" + block,
        );

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2))
        return r.data;
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     */
    async getReceipt(tx: string, lastConfirmed: number): Promise<IReceiptWithProof> {
        const r: AxiosResponse = await axios.get(
            this.api + "/eth/receipt/" + tx + "/" + lastConfirmed
        );

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2))
        return r.data;
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     */
    async getProposal(
        leaves: number[],
        target: number,
        last_leaf: number,
    ): Promise<IEthereumHeaderThingWithProof> {
        const r: AxiosResponse = await axios.post(this.api + "/eth/proposal", {
            leaves,
            target,
            last_leaf,
        });

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2));
        return r.data;
    }
}
