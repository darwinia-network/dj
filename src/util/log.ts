import chalk from "chalk";
import { stringify } from "javascript-stringify";

const l = chalk.dim("[ ");
const r = chalk.dim(" ]: ");

export enum Logger {
    Error,
    Event,
    Info,
    Ok,
    Trace,
    Wait,
    Warn,
}

export enum LoggerEnv {
    All,
    Error,
    Info,
    None,
}

const FIXED_LOGS = [
    Logger.Error,
];

const INFO_LOGS = [
    Logger.Event,
    Logger.Info,
    Logger.Wait,
    Logger.Warn,
    Logger.Ok,
];

const ALL_LOGS = [
    Logger.Error,
    Logger.Event,
    Logger.Info,
    Logger.Ok,
    Logger.Trace,
    Logger.Wait,
    Logger.Warn,
];

/**
 * check if we are under browser
 */
export function isBrowser(): boolean {
    try {
        if (window === undefined) {
            return false;
        } else {
            return true;
        }
    } catch (e) {
        return false;
    }
}

/**
 * infer current env, if we have log limits
 */
export function loggerEnv(): LoggerEnv {
    let label: string = isBrowser() ?
        (window as any).LOGGER :
        process.env.LOGGER;

    if (label === undefined) {
        label = "";
    }

    switch (label.toLowerCase()) {
        case "error":
            return LoggerEnv.Error;
        case "none":
            return LoggerEnv.None;
        case "all":
            return LoggerEnv.All;
        default:
            return LoggerEnv.Info;
    }
}

/**
 * infer if shoud output log
 *
 * @param {Logger} label - log type
 */
export function shouldOutputLog(label: Logger): boolean {
    const env: LoggerEnv = loggerEnv();
    let logs: Logger[] = FIXED_LOGS;

    switch (env) {
        case LoggerEnv.All:
            logs = logs.concat(ALL_LOGS);
            break;
        case LoggerEnv.None:
            logs = [];
            break;
        case LoggerEnv.Error:
            break;
        default:
            logs = logs.concat(INFO_LOGS);
            break;
    }

    for (const i in logs) {
        if (logs[i] === label) {
            return true;
        }
    }

    return false;
}

/**
 * print messages to console, including stdout and stderr(error)
 *
 * @param {String} label - the log label
 * @param {String} context - the log context
 */
function flush(label: string, context: any): void {
    let plain = l + label + r;

    if (typeof (context) === "string") {
        plain += context;
    } else if (typeof (context) === "object" && Object.keys(context).length > 0) {
        plain += JSON.stringify(context);
    } else {
        plain += stringify(context);
    }

    // output
    const sl = stringify(label);
    if (sl && sl.indexOf("error") > -1) {
        console.error(plain);
    } else {
        console.log(plain);
    }
}

/**
 * Envorinment logger
 *
 * @param {String} s - the log out string
 */
export function log(s: any) {
    if (shouldOutputLog(Logger.Info)) {
        flush(chalk.cyan.dim("info"), chalk.dim(s));
    }
}

/**
 * @param {String} s - the log out string
 */
log.debug = (s: any): void => {
    if (shouldOutputLog(Logger.Error)) {
        flush(chalk.dim("debug"), s);
    }
};

/**
 * @param {String} s - the log out string
 */
log.err = (s: any): void => {
    if (shouldOutputLog(Logger.Error)) {
        flush(chalk.red("error"), s);
    }
};

/**
 * common log - console.log
 *
 * @param {Any} s - the log context
 */
log.event = (s: any): void => {
    if (shouldOutputLog(Logger.Error)) {
        flush(chalk.magenta("event"), s);
    }
};

/**
 * log error and quit process
 *
 * @description - only support in nodejs
 * @param {String} s - the log context
 */
log.ex = (s: any): void => {
    if (shouldOutputLog(Logger.Error)) {
        flush(chalk.red("error"), s);
        process.exit(1);
    }
};

/**
 * common log - console.log
 *
 * @param {Any} msg - the log context
 */
log.n = (msg: any): void => {
    console.log(msg);
};

/**
 * @param {String} s - the log context
 */
log.ok = (s: any): void => {
    if (shouldOutputLog(Logger.Ok)) {
        flush(chalk.green("ok"), s);
    }
};

/**
 * log ok and quit process
 *
 * @description - only support in nodejs
 * @param {String} s - the log context
 */
log.ox = (s: any): void => {
    if (shouldOutputLog(Logger.Ok)) {
        flush(chalk.green("ok"), s);
        process.exit(0);
    }
};

/**
 * @param {String} s - the log out string
 */
log.trace = (s: any): void => {
    if (shouldOutputLog(Logger.Trace)) {
        flush(chalk.cyan.dim("trace"), chalk.dim(s));
    }
};

/**
 * @param {String} s - the log out string
 */
log.wait = (s: any): void => {
    if (shouldOutputLog(Logger.Wait)) {
        flush(chalk.cyan("wait"), s);
    }
};

/**
 * @param {String} s - the log out string
 */
log.warn = (s: any): void => {
    if (shouldOutputLog(Logger.Warn)) {
        flush(chalk.yellow("warn"), s);
    }
};
