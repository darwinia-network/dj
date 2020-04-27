import { execSync } from "child_process";
import Web3Utils from "web3-utils";
import { log } from "./log";

export interface IDoubleNodeWithMerkleProof {
    dag_nodes: string[],
    proof: string[],
}

/**
 * proof eth header
 */
export async function getProof(
    blockNumber: number, binPath: string,
): Promise<IDoubleNodeWithMerkleProof[]> {
    let output: string = execSync(
        `${binPath} proof ${blockNumber} | sed -e '1,/Json output/d'`
    ).toString();

    // retrying...
    while (output.length === 0) {
        log.warn("get proof failed, retry in 3s...");
        await new Promise(() => {
            setTimeout(async () => {
                output = execSync(
                    `${binPath} proof ${blockNumber} | sed -e '1,/Json output/d'`
                ).toString();
            }, 3000)
        });
    }

    log.trace(output);
    const rawProof = JSON.parse(output);
    const h512s = rawProof.elements
        .filter((_: any, index: number) => index % 2 === 0)
        .map((element: any, index: number) => {
            return Web3Utils.padLeft(element, 64)
                + Web3Utils.padLeft(rawProof.elements[index * 2 + 1], 64).substr(2)
        });

    return h512s
        .filter((_: any, index: number) => index % 2 === 0)
        .map((element: any, index: number) => {
            return {
                dag_nodes: [element, h512s[index * 2 + 1]],
                proof: rawProof.merkle_proofs.slice(
                    index * rawProof.proof_length,
                    (index + 1) * rawProof.proof_length,
                ).map((leaf: any) => Web3Utils.padLeft(leaf, 32))
            };
        });
}
