import { execSync } from "child_process";
import Web3Utils from "web3-utils";

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
    const output: string = execSync(
        `${binPath} ${blockNumber} | sed -e '1,/Json output/d'`
    ).toString();

    const rawProof = JSON.parse(output);
    const h512s = rawProof.elements
        .filter((_: any, index: number) => index % 2 === 0)
        .map((element: any, index: number) => {
            return Web3Utils.padLeft(element, 64)
                + Web3Utils.padLeft(rawProof.elements[index*2 + 1], 64).substr(2)
        });

    return h512s
        .filter((_: any, index: number) => index % 2 === 0)
        .map((element: any, index: number) => {
            return {
                dag_nodes: [element, h512s[index*2 + 1]],
                proof: rawProof.merkle_proofs.slice(
                    index * rawProof.proof_length,
                    (index + 1) * rawProof.proof_length,
                ).map((leaf: any) => Web3Utils.padLeft(leaf, 32))
            };
        });
}
