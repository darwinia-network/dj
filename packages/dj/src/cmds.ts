import { autoAPI, autoWeb3, ExResult } from "@darwinia/api";
import { execSync } from "child_process";
import {
    Config, chalk, IDarwiniaEthBlock,
    IDoubleNodeWithMerkleProof,
    log, TYPES_URL,
} from "@darwinia/util";
import { Arguments } from "yargs";
import { Service } from "./service";
import Grammer from "./grammer";
import Relay from "./relay";
import Shadow from "./shadow";

/**
 * @param {Arguments} args - yarg args
 */
export async function infoHandler(args: Arguments) {
    const api = await autoAPI();
    const web3 = await autoWeb3();

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
            const last = await web3.getBlock(bestHeaderHash.toString());
            log.ox(JSON.stringify(last, null, 2));
            break;
        case "header":
            const block = (args.block as string);
            let header: IDarwiniaEthBlock | null = null;
            if (block === "") {
                const hash = await api._.query.ethRelay.bestHeaderHash();
                header = await web3.getBlock(hash.toString());
            }

            header = await web3.getBlock(block);
            log.ox(JSON.stringify(header, null, 2));
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
        case "shadow":
            service = await Shadow.new();
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
    const web3 = await autoWeb3();
    const cfg = new Config();
    if (!args.block) {
        const bestHeaderHash = await api._.query.ethRelay.bestHeaderHash();
        const last = await web3.getBlock(bestHeaderHash.toString());
        args.block = last.number + 1;
    }

    const block = await web3.getBlock((args.block as number));
    const proof = await cfg.proofBlock((args.block as number));

    const res = await api.relay(
        (block as IDarwiniaEthBlock),
        (proof as IDoubleNodeWithMerkleProof[]),
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
