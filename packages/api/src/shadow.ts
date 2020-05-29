import axios, { AxiosResponse } from "axios";

import { BlockWithProof, IDarwiniaEthBlock, Block, log } from "@darwinia/util";

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
        if (typeof (block) === "number") {
            r = await axios.post(this.api, {
                method: "shadow_getEthHeaderByNumber",
                params: {
                    block_num: block,
                    id: 0,
                }
            })
        } else {
            r = await axios.post(this.api, {
                method: "shadow_getEthHeaderByHash",
                params: {
                    hash: block,
                    id: 0,
                }
            })
        }

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2));
        return Block.from(r.data.result.header);
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     */
    async getBlockWithProof(block: number | string, format = "raw"): Promise<BlockWithProof> {
        let r: AxiosResponse;
        if (typeof (block) === "number") {
            r = await axios.post(this.api, {
                method: "shadow_getEthHeaderWithProofByNumber",
                params: {
                    block_num: block,
                    id: 0,
                    options: {
                        format,
                    },
                }
            });
        } else {
            r = await axios.post(this.api, {
                method: "shadow_getEthHeaderWithProofByHash",
                params: {
                    hash: block,
                    id: 0,
                    options: {
                        format,
                    },
                }
            });
        }

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2))
        return [r.data.result.eth_header, r.data.result.proof];
    }

    /**
     * Get darwinia block with eth proof
     *
     * @param {number} block - block number
     */
    async batchBlockWithProofByNumber(block: number, batch = 1, format = "raw"): Promise<BlockWithProof[]> {
        const r: AxiosResponse = await axios.post(this.api, {
            method: "shadow_batchEthHeaderWithProofByNumber",
            params: {
                number: block,
                batch,
                id: 0,
                options: {
                    format,
                },
            }
        });

        // Trace the back data
        log.trace(JSON.stringify(r.data, null, 2))
        return r.data.result.map(
            (result: Record<string, any>) => [result.eth_header, result.proof]
        );
    }
}
