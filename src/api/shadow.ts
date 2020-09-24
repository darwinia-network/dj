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
 * @method getHeaderThing - get ethereum headerthing
 * @method getReceipt - get ethereum transaction receipt
 * @method getProposal - get darwinia proposal
 */
export class ShadowAPI {
    constructor(api: string) {
        axios.defaults.baseURL = api;
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     * @returns {Promise<IEthereumHeaderThingWithConfirmation>} ethereum headerthing with confirmation
     */
    async getHeaderThing(block: number): Promise<IEthereumHeaderThingWithConfirmation> {
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
     * @param {string} tx - block number
     * @param {number} lastConfirmed - block number
     * @returns {Promise<IReceiptWithProof>} receipt with proof
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
     * @param {number} member - the block needs to be verified
     * @param {number} target - target proposal block
     * @param {number} last_leaf - last leaf of blocks
     * @returns {Promise<IEthereumHeaderThingWithProof>} Ethereum headerthing with proof
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
