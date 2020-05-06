import { autoAPI, ExResult, ShadowAPI } from "@darwinia/api";
import { execSync } from "child_process";
import {
    Config, chalk, IDarwiniaEthBlock,
    log, TYPES_URL,
} from "@darwinia/util";
import { Vec, Struct } from "@polkadot/types";
import { Arguments } from "yargs";
import { Service } from "./service";
import Grammer from "./grammer";
import Relay from "./relay";

/**
 * @param {Arguments} args - yarg args
 */
export async function infoHandler(args: Arguments) {
    const api = await autoAPI();
    const cfg = new Config();
    const shadow = new ShadowAPI(cfg.shadow);

    switch (args.recipe) {
        case "balance":
            let addr = (args.address as string);
            if (addr === "") {
                addr = api.account.address;
            }

            const balance = await api.getBalance(addr);
            const s = balance + " RING 💰";
            log.ox(s);
            break;
        case "bestHeader":
            const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
            const last = await shadow.getBlock(bestHeaderHash.toString());
            log.ox(JSON.stringify(last, null, 2));
            break;
        case "header":
            const block = (args.block as string);
            let header: IDarwiniaEthBlock | null = null;
            if (block === "") {
                const hash = await api._.query.ethRelay.bestHeaderHash();
                header = await shadow.getBlock(hash.toString());
            }

            header = await shadow.getBlock(block);
            log.ox(JSON.stringify(header, null, 2));
            break;
        case "codec":
            const codecBlock: string = (args.block as string);
            if (codecBlock === "") {
                const hash = await api._.query.ethRelay.bestHeaderHash();
                log.ox(JSON.stringify(shadow.getBlockWithProof(hash.toString()), null, 2))
            }

            // Get proof by hash or number
            let pair: any;
            if (codecBlock.length >= 64) {
                pair = shadow.getBlockWithProof(codecBlock);
            } else {
                pair = shadow.getBlockWithProof(Number.parseInt(codecBlock, 10));
            }

            // codec resp
            const resp = {
                eth_header: new Struct(
                    api._.registry,
                    api.types.EthHeader,
                    pair[0]
                ).toHex(),
                proof: new Vec(
                    api._.registry,
                    (api._.registry.get("DoubleNodeWithMerkleProof") as any),
                    pair[1],
                ).toHex(),
            }

            // log proofs
            log.ox(JSON.stringify(resp, null, 2))
            break;
        default:
            break;
    }
}

/**
 * @param {Arguments} args - yarg args
 */
export async function edithandler(args: Arguments) {
    const cfg = new Config();

    if ((args.edit as boolean)) {
        cfg.edit();
    } else if ((args.update as boolean)) {
        await cfg.updateTypes().catch((e: any) => {
            log.err(e.toString());
            log.err([
                "network connection fail, please check your network: ",
                `you can download types.json from ${chalk.cyan.underline(TYPES_URL)}`,
                `your self, and put it into ${cfg.path.root}`
            ].join(""));
        });
    } else {
        log.n(JSON.parse(cfg.toString()));
    }
}

/**
 * @param {Arguments} args - yarg args
 */
export async function keepHandler(args: Arguments) {
    let daemon: boolean = false;
    let script = `keep ${args.service}`;
    let service: Service | null = null;

    // select service
    switch ((args.service as string)) {
        case "grammer":
            service = await Grammer.new();
            break;
        case "relay":
            service = await Relay.new();
            break;
        default:
            break;
    }

    // not match
    if (service === null) {
        log.ex("paramter not correct, try: `dj keep relay`");
    }

    // load port
    if ((args.port as number)) {
        script += ` -p ${args.port}`;
        (service as Service).port = (args.port as number);
    }

    // load daemon
    if ((args.daemon as boolean)) {
        daemon = true;
    }

    // exec
    if (daemon) {
        execSync(`pm2 start dj -- keep ${script}`);
    } else if ((service as Service).port !== 0) {
        await (service as Service).foreverServe();
    } else {
        await (service as Service).forever();
    }
}

/**
 * @param {Arguments} args - yarg args
 */
export async function relayHandler(args: Arguments) {
    const api = await autoAPI();
    const cfg = new Config();
    const shadow = new ShadowAPI(cfg.shadow);
    if (!args.block) {
        const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
        const last = await shadow.getBlock(bestHeaderHash.toString());
        args.block = last.number + 1;
    }

    const shadowResp = await shadow.getBlockWithProof(args.block as number);
    const res = await api.relay(
        shadowResp[0],
        shadowResp[1],
        (args.finalize as boolean),
    ).catch((e: ExResult) => {
        log.ex(e.toString());
    });

    if (args.finalize) {
        log.ox(`relay header succeed 🎉 - ${(res as ExResult).toString()}`);
    } else {
        log.ok(`the tx is contained in block ${(res as ExResult).blockHash}`);
        log.ox(chalk.cyan.underline(
            `https://crab.subscan.io/extrinsic/${(res as ExResult).exHash}`
        ));
    }
}

/**
 * @param {Arguments} args - yarg args
 */
export async function transferHandler(args: Arguments) {
    const api = await autoAPI();
    const res = await api.transfer(
        (args.address as string),
        (args.amount as number),
    ).catch((e: ExResult) => {
        log.ex(e.toString());
    });

    log.ox("transfer succeed 💰 - " + (res as ExResult).toString());
}
