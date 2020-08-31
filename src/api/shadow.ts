import axios, { AxiosResponse } from "axios";

import {
    log, Block, IDarwiniaEthBlock,
} from "../util";
import {
    BlockWithProof,
    IReceiptWithProof,
    IEthHeaderThing,
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
        r = await axios.get(this.api + "/header/" + block);

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2));
        return Block.from(r.data);
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     */
    async getBlockWithProof(block: number | string, format = "raw"): Promise<BlockWithProof> {
        const r: AxiosResponse = await axios.get(
            this.api + "/proof/" + block + "?format=" + format,
        );

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2))
        return [r.data.eth_header, r.data.ethash_proof, r.data.mmr_root];
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     */
    async getReceipt(tx: string, last: number): Promise<IReceiptWithProof> {
        const r: AxiosResponse = await axios.get(
            this.api + "/eth/receipt/" + tx + "?last=" + last
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
        members: number[],
        lastLeaf: number,
    ): Promise<IEthHeaderThing[]> {
        const r: AxiosResponse = await axios.post(this.api + "/eth/proposal", {
            members,
            last_leaf: lastLeaf,
        });

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2))
        return r.data;
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     */
    async batchBlockWithProofByNumber(block: number, batch = 1, format = "raw"): Promise<BlockWithProof[]> {
        const r: AxiosResponse = await axios.get(
            this.api + "/batch/" + block + "?batch=" + batch + "&format=" + format,
        );

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2))
        return r.data.map(
            (result: Record<string, any>) => [result.eth_header, result.ethash_proof]
        );
    }
}
