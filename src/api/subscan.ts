import axios, { AxiosResponse } from "axios";
import { Extrinsic } from "./types/extrinsic";

const BASE = "https://crab.subscan.io/api/";

/**
 * Get Extrinsic detail by hash
 */
export async function getExtrinsic(hash: string): Promise<Extrinsic> {
    const res: AxiosResponse = await axios.post(BASE + "scan/extrinsic", { hash });
    return res.data.data;
}
