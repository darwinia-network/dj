import chalk from "chalk";

const l = chalk.dim("[ ");
const r = chalk.dim(" ]: ");

export enum Logger {
    Error,
    Event,
    Info,
    Trace,
    Wait,
    Warn,
}

export enum LoggerEnv {
    All,
    Error,
    Info,
    None,
    Trace,
}

/**
 * @description - check if we are under browser
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
 * @description - infer current env, if we have log limits
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
        case "info":
            return LoggerEnv.Info;
        case "trace":
            return LoggerEnv.Trace;
        default:
            return LoggerEnv.All;
    }
}

/**
 * infer if shoud output log
 *
 * @param label Logger - log type
 */
export function shouldOutputLog(label: Logger): boolean {
    const env: LoggerEnv = loggerEnv();

    if ((env === LoggerEnv.Info &&
        label !== Logger.Info &&
        label !== Logger.Error
    ) || (env === LoggerEnv.Error &&
        label !== Logger.Error
        ) || env === LoggerEnv.None) {
        return false;
    }

    return true;
}

/**
 * print messages to console, including stdout and stderr(error)
 *
 * @param label string - the log label
 * @param context string - the log context
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
 * @param s string - the log out string
 */
export function log(s: string) {
    if (shouldOutputLog(Logger.Info)) {
        flush(chalk.cyan.dim("info"), s);
    }
}

/**
 * @param s string - the log out string
 */
log.warn = (s: string): void => {
    if (shouldOutputLog(Logger.Warn)) {
        flush(chalk.yellow("warn"), s);
    }
};

/**
 * @param s string - the log out string
 */
log.wait = (s: string): void => {
    if (shouldOutputLog(Logger.Wait)) {
        flush(chalk.cyan("wait"), s);
    }
};

/**
 * @param s string - the log out string
 */
log.err = (s: string): void => {
    if (shouldOutputLog(Logger.Error)) {
        flush(chalk.red("error"), s);
    }
};

/**
 * log error and quit process,
 * @description - only support in nodejs
 * @param s string - the log context
 */
log.ex = (s: string): void => {
    if (shouldOutputLog(Logger.Error)) {
        flush(chalk.red("error"), s);
        process.exit(1);
    }
};
