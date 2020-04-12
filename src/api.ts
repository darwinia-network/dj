/* tslint:disable:variable-name */
import { ApiPromise, SubmittableResult, WsProvider } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import Keyring from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { DispatchError, EventRecord } from "@polkadot/types/interfaces/types";

import { IDarwiniaEthBlock } from "./block";
import { log } from "./log";

export type ExResult = IExOk | ExError;

export interface IErrorDoc {
    name: string;
    section: string;
    documentation: string[];
}

export interface IReceipt {
    index: string;
    proof: string;
    header_hash: string;
}

export interface IExOk {
    blockHash: string;
    exHash: string;
}

/**
 * Extrinsic Error
 *
 * @property {String} name - Error name
 * @property {String} section - Error section
 * @property {String} documentation - Error documentation
 */
export class ExError {
    public name: string;
    public section: string;
    public documentation: string[];

    constructor(doc: IErrorDoc) {
        this.name = doc.name;
        this.section = doc.section;
        this.documentation = doc.documentation;
    }

    /**
     * convert extrinsic doc into string
     */
    public toString(): string {
        return `${this.name}.${this.section} - ${this.documentation.join(" ")}`;
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
     * new darwinia account from seed
     *
     * @param {String} seed - seed of darwinia account
     */
    public static async seed(seed: string) {
        return new Keyring({ type: "sr25519" }).addFromUri(seed);
    }

    /**
     * new darwinia account from mnemonic
     *
     * @param {String} mnemonic - mnemonic of darwinia account
     */
    public static async memrics(mnemonic: string) {
        return new Keyring({ type: "sr25519" }).addFromMnemonic(mnemonic);
    }

    /**
     * init darwinia api async
     *
     * @param {KeyringPair} account - darwinia account
     * @param {Record<string, any>} types - types of darwinia
     * @param {String} node - the ws address of darwinia
     */
    public static async new(
        account: KeyringPair,
        node: string,
        types: Record<string, any>,
    ): Promise<API> {
        const api = await ApiPromise.create({
            provider: new WsProvider(node),
            types,
        }).catch((e) => {
            log.err(e);
            log.err("init polkadot api failed");
        });

        log.ok("init darwinia api succeed");
        return new API(account, (api as ApiPromise));
    }

    public ap: ApiPromise;
    private account: KeyringPair;

    /**
     * init darwinia api
     *
     * @param {KeyringPair} account - darwinia account
     * @param {ApiPromise} ap - raw polkadot api
     */
    constructor(account: KeyringPair, ap: ApiPromise) {
        this.account = account;
        this.ap = ap;
    }

    /**
     * get the ring balance
     */
    public async getBalance(): Promise<string> {
        const account = await this.ap.query.system.account(this.account.address);
        return account.data.free.toString();
    }

    /**
     * relay darwinia header
     *
     * @param {DarwiniaEthBlock} block - darwinia style eth block
     */
    public async redeem(receipt: IReceipt): Promise<ExResult> {
        const ex: SubmittableExtrinsic<"promise"> = this.ap.tx.ethRelay.redeem({
            Ring: receipt,
        });
        return await this.blockFinalized(ex);
    }

    /**
     * relay darwinia header
     *
     * @param {DarwiniaEthBlock} block - darwinia style eth block
     */
    public async relay(block: IDarwiniaEthBlock): Promise<ExResult> {
        const ex: SubmittableExtrinsic<"promise"> = this.ap.tx.ethRelay.relayHeader(block);
        return await this.blockFinalized(ex);
    }

    /**
     * reset darwinia header
     *
     * @param {DarwiniaEthBlock} block - darwinia style eth block
     */
    public async reset(block: IDarwiniaEthBlock): Promise<ExResult> {
        const ex: SubmittableExtrinsic<"promise"> = this.ap.tx.ethRelay.resetGenesisHeader(
            block, block.difficulty,
        );

        return await this.blockFinalized(ex);
    }

    /**
     * transfer ring to address
     *
     * @param {String} address - the address of receiver
     * @param {Number} amount - transfer amount
     */
    public async transfer(addr: string, amount: number): Promise<ExResult> {
        const ex = this.ap.tx.balances.transfer(addr, amount);
        return await this.blockFinalized(ex);
    }

    /**
     * block requests till block finalized
     *
     * @param {SubmittableExtrinsic<"promise">} ex - extrinsic
     */
    private async blockFinalized(ex: SubmittableExtrinsic<"promise">): Promise<ExResult> {
        let blockHash = "";

        return await new Promise((resolve, reject) => {
            ex.signAndSend(this.account, {}, (sr: SubmittableResult) => {
                const status = sr.status;
                const events = sr.events;

                log.trace(`Transaction status: ${status.type}`);
                log.trace(status.toString());

                if (status.isInBlock) {
                    blockHash = status.asInBlock.toHex().toString();
                    if (events) {
                        events.forEach(async (r: EventRecord) => {
                            log.trace(
                                "\t" +
                                    r.phase.toString() +
                                    `: ${r.event.section}.${r.event.method}` +
                                    r.event.data.toString(),
                            );

                            if ((r.event.data[0] as DispatchError).isModule) {
                                let doc = await this.ap.registry.findMetaError(
                                    (r.event.data[0] as DispatchError).asModule.toU8a(),
                                );
                                let err = new ExError(doc);
                                reject(err);
                            }
                        });
                    }
                } else {
                    if (status.isInvalid) {
                        log.warn("Invalid Extrinsic");
                    } else if (status.isRetracted) {
                        log.warn("Extrinsic Retracted");
                    } else if (status.isUsurped) {
                        log.warn("Extrinsic Usupred");
                    } else if (status.isFinalized) {
                        log.trace(`Finalized block hash: ${blockHash}`);
                    }

                    resolve({
                        blockHash,
                        exHash: ex.hash.toString(),
                    });
                }
            });
        });
    }
}
