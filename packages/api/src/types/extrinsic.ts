/* tslint:disable:variable-name */
export interface ExtrinsicParams {
    name: string;
    type: string;
    value: string;
    valueRaw: string;
}

export interface ExtrinsicTransfer {
    from: string;
    to: string;
    module: string;
    amount: string;
    hash: string;
    block_timestamp: number;
    block_num: number;
    extrinsic_index: string;
    success: boolean;
    fee: string;
}

export interface ExtrinsicEvent {
    event_index: string;
    block_num: number;
    extrinsic_idx: number;
    module_id: string;
    params: string;
    extrinsic_hash: string;
    event_idx: string;
    finalized: boolean;
}

export interface Extrinsic {
    block_timestamp: number;
    block_num: number;
    extrinsic_index: string;
    call_module_function: string;
    call_module: string;
    account_id: string;
    signature: string;
    nonce: number;
    extrinsic_hash: string;
    success: boolean;
    params: ExtrinsicParams[];
    transfer: ExtrinsicTransfer;
    event: ExtrinsicEvent[];
    fee: string;
    error: any;
    finalized: boolean;
}
