/* tslint:disable:variable-name */
import { log, Config } from "../util";
import { ApiPromise, SubmittableResult, WsProvider } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { Keyring, decodeAddress } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { DispatchError, EventRecord } from "@polkadot/types/interfaces/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import {
    IEthereumHeaderThingWithProof,
    IEthereumHeaderThingWithConfirmation,
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
        return await API.new(seed, cfg.node, cfg.relayer, cfg.types);
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
        relayer: string,
        types: Record<string, any>,
    ): Promise<API> {
        const api = await ApiPromise.create({
            provider: new WsProvider(node),
            types,
        });

        const account = await API.seed(seed);
        log.trace("init darwinia api succeed");
        const relayerAddr = relayer.length > 0 ? decodeAddress(relayer) : new Uint8Array();
        return new API(account, (api as ApiPromise), relayerAddr, types);
    }

    public account: KeyringPair;
    public relayer: Uint8Array;
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
    constructor(
        account: KeyringPair,
        ap: ApiPromise,
        relayer: Uint8Array,
        types: Record<string, any>,
    ) {
        this.account = account;
        this.relayer = relayer;
        this.types = types;
        this._ = ap;
    }

    /**
     * Get last confirm block
     */
    public async lastConfirm(): Promise<number> {
        const res = await this._.query.ethereumRelay.confirmedBlockNumbers();
        if (res.toJSON() === null) {
            return 0;
        }

        const blocks = res.toJSON() as number[];
        return blocks[blocks.length - 1];
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
     * Set confirmed block with sudo privilege
     */
    public async setConfirmed(headerThing: IEthereumHeaderThingWithConfirmation): Promise<ExResult> {
        log.event(`Set confirmed block ${headerThing.header_thing.header.number}`);
        const ex = this._.tx.ethereumRelay.setConfirmed(headerThing.header_thing);
        return await this.blockFinalized(this._.tx.sudo.sudo(ex));
    }

    /**
     * Check if should relay target
     *
     * @param {number} target - target header
     */
    public async shouldRelay(target: number): Promise<boolean> {
        log("Check if target block less than the last confirmed block");
        const lastConfirmed = await this.lastConfirm();
        if (target < lastConfirmed) {
            log("...target is less than lastConfirmed");
            return false;
        }
        // Check if has confirmed
        log("...target block is great than lastConfirmed");
        log("Check if proposal has been confirmed");
        const confirmed = await this._.query.ethereumRelay.confirmedHeaders(target);
        if (confirmed.toJSON()) {
            log(`Proposal ${target} has been submitted yet`);
            return false;
        }

        // Check if is pendding
        log("...target block has not been submitted");
        log("Check if proposal is pending");
        const pendingHeaders = (
            await this._.query.ethereumRelayerGame.pendingHeaders()
        ).toJSON() as string[][];
        if (pendingHeaders.filter((h: any) => Number.parseInt(h[1], 10) === target).length > 0) {
            log(`Proposal ${target} is pending`);
            return false;
        }

        // Check if target contains in the current Game
        //
        // Storage Key: `0xcdacb51c37fcd27f3b87230d9a1c265088c2f7188c6fdd1dffae2fa0d171f440`
        log("...target block is not pending");
        log("Check if proposal is in the relayer game");
        for (const key of (await this._.rpc.state.getKeysPaged(
            "0xcdacb51c37fcd27f3b87230d9a1c265088c2f7188c6fdd1dffae2fa0d171f440",
            32,
        )).toJSON() as any[]) {
            const codec: string = (await this._.rpc.state.getStorage(key) as any).toJSON();
            const proposal = this._.createType("Vec<RelayProposalT>" as any, codec);
            for (const bonded of proposal.toHuman()[0].bonded_proposal) {
                if (Number.parseInt(bonded[1].header.number.replace(/,/g, ""), 10) >= target) {
                    return false;
                }
            }
        };

        log("...target block is relayable");
        return true;
    }

    /**
     * get the specify block
     *
     * @param {IEthHeaderThing} headerThings - Eth Header Things
     */
    public async submitProposal(headerThings: IEthereumHeaderThingWithProof[]): Promise<ExResult> {
        const latest = headerThings[headerThings.length - 1].header.number;

        // Submit new proposal
        log.event(`Submit proposal contains block ${latest}`);
        let ex = this._.tx.ethereumRelay.submitProposal(headerThings);
        if (this.relayer.length > 0) {
            ex = this._.tx.proxy.proxy(this.relayer, "EthereumBridge", ex);
        }

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
