/* tslint:disable:variable-name */
import { IDarwiniaEthBlock, log } from "@darwinia/util";
import { ApiPromise, SubmittableResult, WsProvider } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import Keyring from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { DispatchError, EventRecord } from "@polkadot/types/interfaces/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";

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
        account: KeyringPair,
        node: string,
        types: Record<string, any>,
    ): Promise<API> {
        const api = await ApiPromise.create({
            provider: new WsProvider(node),
            types,
        });

        log.trace("init darwinia api succeed");
        return new API(account, (api as ApiPromise));
    }

    public account: KeyringPair;
    public _: ApiPromise;

    /**
     * init darwinia api
     *
     * @description please use `API.new` instead
     *
     * @param {KeyringPair} account - darwinia account
     * @param {ApiPromise} ap - raw polkadot api
     */
    constructor(account: KeyringPair, ap: ApiPromise) {
        this.account = account;
        this._ = ap;
    }

    /**
     * get ring balance by darwinia account address
     *
     * @param {string} addr - account address of darwinia
     */
    public async getBalance(addr: string): Promise<string> {
        const account = await this._.query.system.account(addr);
        return account.data.free.toString();
    }

    /**
     * relay darwinia header
     *
     * @param {DarwiniaEthBlock} block - darwinia style eth block
     */
    public async redeem(receipt: IReceipt): Promise<ExResult> {
        const ex: SubmittableExtrinsic<"promise"> = this._.tx.ethRelay.redeem({
            Ring: receipt,
        });
        return await this.blockFinalized(ex);
    }

    /**
     * relay darwinia header
     *
     * @param {DarwiniaEthBlock} block - darwinia style eth block
     * @param {Bool} inBlock - if resolve when inBlock
     */
    public async relay(
        block: IDarwiniaEthBlock,
        inBlock?: boolean,
    ): Promise<ExResult> {
        const ex: SubmittableExtrinsic<"promise"> = this._.tx.ethRelay.relayHeader(block);
        return await this.blockFinalized(ex, inBlock);
    }

    /**
     * reset darwinia header
     *
     * @param {DarwiniaEthBlock} block - darwinia style eth block
     */
    public async reset(block: IDarwiniaEthBlock): Promise<ExResult> {
        const ex: SubmittableExtrinsic<"promise"> = this._.tx.ethRelay.resetGenesisHeader(
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
        const ex = this._.tx.balances.transfer(addr, amount);
        return await this.blockFinalized(ex);
    }

    /**
     * block requests till block finalized
     *
     * @param {SubmittableExtrinsic<"promise">} ex - extrinsic
     * @param {Boolean} inBlock - if resolve when inBlock
     */
    private async blockFinalized(
        ex: SubmittableExtrinsic<"promise">,
        inBlock?: boolean,
    ): Promise<ExResult> {
        const res = new ExResult(
            false,
            "",
            ex.hash.toString(),
        );

        return await new Promise((resolve, reject) => {
            ex.signAndSend(this.account, {}, (sr: SubmittableResult) => {
                const status = sr.status;
                const events = sr.events;

                log.trace(`Transaction status: ${status.type}`);
                log.trace(status.toString());

                if (status.isInBlock) {
                    res.blockHash = status.asInBlock.toHex().toString();
                    if (inBlock) {
                        res.isOk = true;
                        resolve(res);
                    }

                    if (events) {
                        events.forEach(async (r: EventRecord) => {
                            log.trace(
                                "\t" +
                                    r.phase.toString() +
                                    `: ${r.event.section}.${r.event.method}` +
                                    r.event.data.toString(),
                            );

                            if (r.event.method.indexOf("Failed") > -1) {
                                log.err("transaction failed");
                                res.isOk = false;
                                res.isErr = true;
                                reject(res);
                            }

                            if ((r.event.data[0] as DispatchError).isModule) {
                                res.docs = await this._.registry.findMetaError(
                                    (r.event.data[0] as DispatchError).asModule.toU8a(),
                                );

                                reject(res);
                            }
                        });
                    }
                } else {
                    if (status.isInvalid) {
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
                        log.trace(`Finalized block hash: ${res.blockHash}`);
                        resolve(res);
                    }
                }
            });
        });
    }
}
