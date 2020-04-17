import {Config, log} from "@darwinia/util";

const Web3Utils = require('web3-utils');
const BN = require('bn.js');
const exec = require('child_process').exec;
const blockFromRpc = require('ethereumjs-block/from-rpc')
const utils = require('ethereumjs-util');

import { API, autoAPI, autoWeb3} from "@darwinia/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {ApiPromise, WsProvider} from "@polkadot/api";


// export {
//     autoEthashProof
// }

export async function autoEthashProof(): Promise<EthashProof> {
    const cfg = new Config();
    return await EthashProof.new(cfg.node, cfg.types);
}

/**
 * @class EthashProof - darwinia ethashproof
 *
 * @method getProof - get ethash proof
 */
export class EthashProof {
    public static async new(
        node: string,
        types: Record<string, any>,
    ): Promise<EthashProof> {
        const api = await ApiPromise.create({
            provider: new WsProvider(node),
            types,
        });

        log.trace("init darwinia ethashproofsucceed");
        return new EthashProof(api as ApiPromise);
    }

    public _: ApiPromise;

    constructor(ap: ApiPromise) {
        this._ = ap;
    }

    public async getProof(blockNumber: number) : Promise<any> {
        return await new Promise( async (resolve, reject) => {
            const timeBeforeProofsComputed = Date.now();
            console.log(`Processing ${blockNumber} block`);
            let ok = false;
            for (let retryIter = 0; retryIter < 10; retryIter++) {
                try {
                    // console.log(await execute(`pwd`));
                    const output = await execute(`../ethashproof/ethashproof/cmd/relayer/relayer ${blockNumber} | sed -e '1,/Json output/d'`)

                    const rawProof = JSON.parse(<string>output);

                    const h512s = rawProof.elements
                        .filter((_: any, index: number) => index % 2 === 0)
                        .map((element: any, index: number) => {
                            return Web3Utils.padLeft(element, 64)
                                + Web3Utils.padLeft(rawProof.elements[index*2 + 1], 64).substr(2)
                        });

                    const args = {
                        block_header: Web3Utils.hexToBytes(rawProof.header_rlp),
                        dag_nodes: h512s
                            .filter((_: any, index: number) => index % 2 === 0)
                            .map((element: any, index: number) => {
                                return {
                                    dag_nodes: [element, h512s[index*2 + 1]],
                                    proof: rawProof.merkle_proofs.slice(
                                        index * rawProof.proof_length,
                                        (index + 1) * rawProof.proof_length,
                                    ).map((leaf: any) => Web3Utils.padLeft(leaf, 32))
                                };
                            }),
                    };

                    console.log(JSON.stringify(args));

                    resolve(args);

                    ok = true;
                    break;
                } catch (e) {
                    console.log(`Sleeping 0.5sec. Failed at iteration #${retryIter}:`, e);
                    await new Promise((resolveNew, rejectNew) => {
                        setTimeout(resolveNew, 500);
                    })
                }
            }
            console.log(
                "Proofs computation took " + Math.trunc((Date.now() - timeBeforeProofsComputed)/10)/100 + "s "
            );
            if (!ok) {
                console.error(`Failed to create a proof for a block #${blockNumber}`);
                process.exit(3);
                reject({error: "Request proof failed"});
            }
        });
    }
}

function execute(command: string){
    return new Promise(resolve => exec(command, (error: any, stdout: unknown, stderr: any) => {
        if (error) {
            console.log(error);
        }
        resolve(stdout);
    }));
};