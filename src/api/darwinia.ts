/* tslint:disable:variable-name */
import { log, Config } from "../util";
import { ApiPromise, SubmittableResult, WsProvider } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import Keyring from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { DispatchError, EventRecord } from "@polkadot/types/interfaces/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { SignedBlock } from "@polkadot/types/interfaces";
import {
    IEthereumHeaderThingWithProof,
    IReceiptWithProof,
} from "../types";

export interface IErrorDoc {
    name: string;
    section: string;
    documentation: string[];
}

/**
 * Extrinsic Result
 *
 * @property {String} isOk - If extrinsic is ok
 * @property {String} isErr - If extrinsic is error
 * @property {String} blockHash - the hash of the block which contains our extrinsic
 * @property {String} exHash - Extrinsic hash
 * @property {IErrorDoc | undefined} docs - Extrinsic error doc
 */
export class ExResult {
    public isOk: boolean;
    public isErr: boolean;
    public exHash: string;
    public blockHash: string;
    public docs?: IErrorDoc;

    /**
     * Extrinsic Result
     *
     * @param {String} isOk - if extrinsic is ok
     * @param {String} blockHash - the hash of the block which contains our extrinsic
     * @param {String} exHash - Extrinsic hash
     * @param {IErrorDoc | undefined} docs - Extrinsic error doc
     */
    constructor(isOk: boolean, blockHash: string, exHash: string, docs?: IErrorDoc) {
        this.isOk = isOk;
        this.isErr = !isOk;
        this.blockHash = blockHash;
        this.exHash = exHash;
        this.docs = docs;
    }

    public toString(): string {
        if (this.docs) {
            return [
                `${this.docs.name}.${this.docs.section} `,
                `- ${this.docs.documentation.join(" ").slice(1)}`,
            ].join("");
        } else {
            return this.exHash;
        }
    }
}

/**
 * @class API - darwinia api
 *
 * @method getBalance - get account balance
 * @method reset - reset eth relay header
 * @method relay - relay eth relay header
 * @method redeem - redeem ring
 * @method transfer - transfer ring
 *
 * @property {KeyringPair} account - darwinia account
 * @property {ApiPromise} ap - raw polkadot api
 */
export class API {
    /**
     * new darwinia API using global `config.json`
     *
     * @returns {API} darwinia api
     */
    public static async auto(): Promise<API> {
        const cfg = new Config();
        const seed = await cfg.checkSeed();
        return await API.new(seed, cfg.node, cfg.types);
    }

    /**
     * new darwinia account from seed
     *
     * @param {String} seed - seed of darwinia account
     */
    public static async seed(seed: string) {
        await cryptoWaitReady();
        return new Keyring({ type: "sr25519" }).addFromUri(seed);
    }

    /**
     * new darwinia account from mnemonic
     *
     * @param {String} mnemonic - mnemonic of darwinia account
     */
    public static async memrics(mnemonic: string) {
        await cryptoWaitReady();
        return new Keyring({ type: "sr25519" }).addFromMnemonic(mnemonic);
    }

    /**
     * init darwinia api async
     *
     * @param {KeyringPair} account - darwinia account
     * @param {Record<string, any>} types - types of darwinia
     * @param {String} node - the ws address of darwinia
     *
     * @example
     * ```js
     * const cfg = new Config();
     * const seed = await API.seed(cfg.seed);
     * const api = await API.new(seed, cfg.node, cfg.types);
     * ```
     */
    public static async new(
        seed: string,
        node: string,
        types: Record<string, any>,
    ): Promise<API> {
        const api = await ApiPromise.create({
            provider: new WsProvider(node),
            types,
        });

        const account = await API.seed(seed);
        log.trace("init darwinia api succeed");
        return new API(account, (api as ApiPromise), types);
    }

    public account: KeyringPair;
    public types: Record<string, any>;
    public _: ApiPromise;

    /**
     * init darwinia api
     *
     * @description please use `API.new` instead
     *
     * @param {KeyringPair} account - darwinia account
     * @param {ApiPromise} ap - raw polkadot api
     */
    constructor(account: KeyringPair, ap: ApiPromise, types: Record<string, any>) {
        this.account = account;
        this.types = types;
        this._ = ap;
    }

    /**
     * Get last confirm block
     */
    public async lastConfirm(): Promise<number> {
        const res = await this._.query.ethereumRelay.lastConfirmedHeaderInfo();
        if (res.toJSON() === null) {
            return 0;
        }

        return (res.toJSON() as any)[0] as number;
    }

    /**
     * get ring balance by darwinia account address
     *
     * @param {string} addr - account address of darwinia
     */
    public async getBalance(addr: string): Promise<string> {
        const account = await this._.query.system.account(addr);
        return JSON.stringify(account.data.toHuman(), null, 2);
    }

    /**
     * Approve block in relayer game
     */
    public async approveBlock(block: number, perms = 4): Promise<ExResult> {
        let ex = this._.tx.ethereumRelay.approvePendingHeader(block);
        if (perms === 7) {
            ex = this._.tx.sudo.sudo(ex);
        } else if (perms === 5) {
            ex = this._.tx.council.execute(ex, ex.length);
        } else {
            return new ExResult(false, "", "");
        }
        log.event(`Approve block ${block}`);
        return await this.blockFinalized(ex, true);
    }

    /**
     * Approve block in relayer game
     */
    public async rejectBlock(block: string | number, perms = 4): Promise<ExResult> {
        let ex = this._.tx.ethereumRelay.rejectPendingHeader(block);
        if (perms === 7) {
            ex = this._.tx.sudo.sudo(ex);
        } else if (perms === 5) {
            ex = this._.tx.council.execute(ex, ex.length);
        } else {
            return new ExResult(false, "", "");
        }
        log.event(`Reject block ${block}`);
        return await this.blockFinalized(ex);
    }

    /**
     * get the specify block
     *
     * @param {IEthHeaderThing} headerThings - Eth Header Things
     */
    public async submitProposal(headerThings: IEthereumHeaderThingWithProof[]): Promise<ExResult> {
        const latest = headerThings[headerThings.length - 1].header.number;
        const cts = ((await this._.query.ethereumRelay.confirmedHeadersDoubleMap(
            Math.floor(latest / 185142), latest,
        )).toJSON() as any).timestamp;
        if (cts !== 0) {
            return new ExResult(true, "", "");
        }

        // Submit new proposal
        log.event(`Submit proposal contains block ${headerThings[headerThings.length - 1].header.number}`);
        const ex = this._.tx.ethereumRelay.submitProposal(headerThings);
        return await this.blockFinalized(ex);
    }

    /**
     * relay darwinia header
     *
     * @param {DarwiniaEthBlock} block - darwinia style eth block
     */
    public async redeem(act: string, proof: IReceiptWithProof): Promise<ExResult> {
        // Check verified
        if ((await this._.query.ethereumBacking.verifiedProof(
            [proof.receipt_proof.header_hash, Number.parseInt(proof.receipt_proof.index, 16)],
        )).toJSON()) {
            return new ExResult(true, "", "");
        }

        // Redeem tx
        log.event(`Redeem tx in block ${proof.header.number}`);
        const ex: SubmittableExtrinsic<"promise"> = this._.tx.ethereumBacking.redeem(act, [
            proof.header,
            proof.receipt_proof,
            proof.mmr_proof,
        ]);
        return await this.blockFinalized(ex);
    }

    /**
     * block requests till block finalized
     *
     * @param {SubmittableExtrinsic<"promise">} ex - extrinsic
     * @param {Boolean} inBlock - if resolve when inBlock
     */
    private blockFinalized(
        ex: SubmittableExtrinsic<"promise">,
        inFinialize = false,
    ): Promise<ExResult> {
        const res = new ExResult(
            false,
            "", // blockHash
            "", // exHash
        );

        return new Promise((resolve, reject) => {
            ex.signAndSend(this.account, {}, (sr: SubmittableResult) => {
                const status = sr.status;
                const events = sr.events;

                log(`Transaction status: ${status.type}`);
                log(status.toString());

                if (status.isInBlock) {
                    res.blockHash = status.asInBlock.toHex().toString();
                    res.exHash = ex.hash.toHex().toString();
                    if (!inFinialize) {
                        res.isOk = true;
                        resolve(res);
                    }

                    if (events) {
                        events.forEach((value: EventRecord): void => {
                            log(
                                "\t" +
                                value.phase.toString() +
                                `: ${value.event.section}.${value.event.method}` +
                                value.event.data.toString(),
                            );

                            if (value.event.method.indexOf("Failed") > -1) {
                                res.isOk = false;
                                res.isErr = true;
                                reject(res);
                            }

                            if ((value.event.data[0] as DispatchError).isModule) {
                                res.docs = this._.registry.findMetaError(
                                    (value.event.data[0] as DispatchError).asModule.toU8a(),
                                );

                                reject(res);
                            }
                        });
                    }
                } else if (status.isInvalid) {
                    log.warn("Invalid Extrinsic");
                    reject(res);
                } else if (status.isRetracted) {
                    log.warn("Extrinsic Retracted");
                    reject(res);
                } else if (status.isUsurped) {
                    log.warn("Extrinsic Usupred");
                    reject(res);
                } else if (status.isFinalized) {
                    res.isOk = true;
                    log(`Finalized block hash: ${res.blockHash}`);
                    resolve(res);
                }
            });
        });
    }
}
