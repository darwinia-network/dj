import chalk from "chalk";

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
    Logger.Info,
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

    for (let i in logs) {
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
function flush(label: string, context: string): void {
    let str = l + label + r + context;
    if (label === "error") {
        console.error(str);
    } else {
        console.log(str);
    }
}

/**
 * @param {String} s - the log out string
 */
export function log(s: string) {
    if (shouldOutputLog(Logger.Info)) {
        flush(chalk.cyan.dim("info"), s);
    }
}

/**
 * @param {String} s - the log out string
 */
log.warn = (s: string): void => {
    if (shouldOutputLog(Logger.Warn)) {
        flush(chalk.yellow("warn"), s);
    }
};

/**
 * @param {String} s - the log out string
 */
log.trace = (s: string): void => {
    if (shouldOutputLog(Logger.Trace)) {
        flush(chalk.dim("trace"), s);
    }
};

/**
 * @param {String} s - the log out string
 */
log.wait = (s: string): void => {
    if (shouldOutputLog(Logger.Wait)) {
        flush(chalk.cyan("wait"), s);
    }
};

/**
 * @param {String} s - the log out string
 */
log.err = (s: string): void => {
    if (shouldOutputLog(Logger.Error)) {
        flush(chalk.red("error"), s);
    }
};

/**
 * log error and quit process
 *
 * @description - only support in nodejs
 * @param {String} s - the log context
 */
log.ex = (s: string): void => {
    if (shouldOutputLog(Logger.Error)) {
        flush(chalk.red("error"), s);
        process.exit(1);
    }
};

/**
 * @param {String} s - the log context
 */
log.ok = (s: string): void => {
    if (shouldOutputLog(Logger.Ok)) {
        flush(chalk.green("ok"), s);
    }
};
