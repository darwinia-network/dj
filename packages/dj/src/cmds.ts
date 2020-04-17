import { autoAPI, autoWeb3, ExResult } from "@darwinia/api";
import { execSync } from "child_process";
import {
    Config, chalk, IDarwiniaEthBlock,
    log, TYPES_URL,
} from "@darwinia/util";
import {Arguments} from "yargs";
import Crash from "./crash";
import Fetcher from "./fetcher";
import Relay from "./relay";
import {autoEthashProof} from "@darwinia/ethhashproof";


/**
 * @param {Arguments} args - yarg args
 */
export async function balanceHandler(args: Arguments) {
    const api = await autoAPI();
    let addr = (args.address as string);
    if (addr === "") {
        addr = api.account.address;
    }

    const balance = await api.getBalance(addr);
    const s = balance + " RING 💰";
    log.ox(s);
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
    if ((args.daemon as boolean)) {
        execSync(`pm2 start dj -- keep ${args.service}`);
    } else {
        switch ((args.service as string)) {
            case "crash":
                const crash = await Crash.new();
                await crash.forever();
            case "crash":
                const fetcher = await Fetcher.new();
                await fetcher.forever();
            case "relay":
                const relay = await Relay.new();
                await relay.forever();
            default:
                break;
        }
    }
}


/**
 * @param {Arguments} args - yarg args
 */
export async function resetHandler(args: Arguments) {
    const api = await autoAPI();
    const web3 = await autoWeb3();
    const block = await web3.getBlock((args.block as string));
    log.trace(JSON.stringify(block, null, 2));

    const res = await api.reset(block).catch((e: ExResult) => {
        log.ex(e.toString());
    });

    log.ox(`reset header succeed 📦 - ${(res as ExResult).toString()}`);
}


/**
 * @param {Arguments} args - yarg args
 */
export async function relayHandler(args: Arguments) {
    const api = await autoAPI();
    const web3 = await autoWeb3();
    if (!args.block) {
        const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
        const last = await web3.getBlock(bestHeaderHash.toString());
        args.block = (last.number as number) + 1;
    }

    const block = await web3.getBlock((args.block as number));
    const res = await api.relay(
        (block as IDarwiniaEthBlock), (args.finalize as boolean),
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

/**
 * @param {Arguments} args - yarg args
 */
export async function proofHandler(args: Arguments) {
    const api = await autoEthashProof();
    const res = await api.getProof(
        (args.number as number),
    ).catch((e: ExResult) => {
        log.ex(e.toString());
    });

    log.ox("proof succeed 🎉  - result:\n" + JSON.stringify(res));
}
