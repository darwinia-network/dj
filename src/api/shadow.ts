/* tslint:disable:variable-name */
import axios from "axios";
import { log } from "../util";
import {
    IReceiptWithProof,
    IEthereumHeaderThingWithConfirmation,
    IEthereumHeaderThingWithProof,
} from "../types";

/// Disable Proxy
process.env.HTTP_PROXY = ""
process.env.HTTPS_PROXY = ""
process.env.http_proxy = ""
process.env.https_proxy = ""

/**
 * Shadow APIs
 *
 * @method getBlock - get raw eth block
 * @method getBlockWithProof - get eth header with proof
 */
export class ShadowAPI {
    constructor(api: string) {
        axios.defaults.baseURL = api;
        // axios.defaults.proxy = false;
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block | string - block number
     */
    async getHeaderThing(block: number | string): Promise<IEthereumHeaderThingWithConfirmation> {
        log(`Get header thing of ${block}`);
        const r: any = await axios.get(
            "/eth/header/" + block,
        ).catch(log.err);

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
        log(`Get receipt of ${tx}`);
        const r: any = await axios.get(
            "/eth/receipt/" + tx + "/" + lastConfirmed,
        ).catch(log.err);

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
        member: number,
        target: number,
        last_leaf: number,
    ): Promise<IEthereumHeaderThingWithProof> {
        log(`Fetching proposal of ${target}`);
        if (member === undefined) {
            member = 0;
        }
        const r: any = await axios.post("/eth/proposal", {
            member,
            target,
            last_leaf,
        }).catch(log.err);

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2));
        return r.data;
    }
}
