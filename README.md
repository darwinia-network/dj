<h1 align="center">
𝒹𝒶𝓇𝓌𝒾𝓃𝒾𝒶.𝒿𝓈
</h1>

[![Node.js CI][workflow-badge]][github]

## SPEC

Gather common javascript usages for darwinia.

## NOTE

**Please make sure you have added github npm registry to your `~/.npmrc`** for `@darwinia-network`, for example:

```npmrc
// add github registry for `@darwinia-network`
@darwinia-network:registry=https://npm.pkg.github.com
registry=https://registry.npmjs.org/
//...
```

## CLI

Install darwinia.js globally

```shell
yarn global add @darwinia-network/darwinia.js
```

Input <kbd>dj</kbd> to your command-line.

```text
dj <hello@darwinia.network>

Commands:
  dj balance [address]            Get balance of darwinia account
  dj reset [block]                Reset genesis eth header in darwinia
  dj relay [block]                Relay eth header to darwinia
  dj transfer <address> <amount>  Relay eth header to darwinia

Options:
  --help, -h     Show help                                             [boolean]
  --version, -V  Show version number                                   [boolean]
```

## Library

### API

```javascript
import { autoAPI } from "@darwinia-network/darwinia.js";

(async () => {
    const api = await autoAPI();
    const balance = await api.getBalance(api.account.address);
    log(balance);
})();
```

| method     | params                         | return          |
|------------|--------------------------------|-----------------|
| getBalance | (addr: string)                 | balance: string |
| reset      | (block: string/number)         | res: ExResult   |
| relay      | (block: string/number)         | res: ExResult   |
| transfer   | (addr: string, amount: number) | res: ExResult   |
| redeem     | (receipt: IReceipt)            | res: ExResult   |

### Config

```javascript
import { API, Config } from "@darwinia-network/darwinia.js";

/**
 * @return {API} api - generate API automatically
 */
export async function autoAPI(): Promise<API> {
    const cfg = new Config();
    const seed = await API.seed(cfg.seed);
    return await API.new(seed, cfg.node, cfg.types);
}

```

The config root of `darwinia.js` is at `~/.darwinia`, once you `new Config()`, the config
files will generate automatically.

```json
{
    "ethSk": "",
    "node": "ws://0.0.0.0:9944",
    "seed": "//Alice",
    "web3": ""
}
```

BTW, the `types.json` in at `~/.darwinia/types.json`, update it if we are outdated, the source
of `types.json` is [here][types.json]

### Logger

```javascript
import { log } from "@darwinia-network/darwinia.js";

(() => {
    log.ox("Javascript is the best programming language!");
})();
```

| method    | param       | description                       |
|-----------|-------------|-----------------------------------|
| log       | (s: string) | info log                          |
| log.err   | (s: string) | error log                         |
| log.ex    | (s: string) | log error and exit process with 1 |
| log.ok    | (s: string) | ok log                            |
| log.ox    | (s: string) | log ok and exit process with 0    |
| log.trace | (s: string) | trace log                         |
| log.wait  | (s: string) | wait log                          |
| log.warn  | (s: string) | warn log                          |

#### LoggerEnv

Magic logger, the logger in `darwinia.js` is just like `env_logger` in Rust, you can set your
logger environment by `LOGGER=XXX` for darwinia.js programs.

Available Enviroments: `[ALL, INFO]`

+ ALL
  + Logger.Error,
  + Logger.Event,
  + Logger.Info,
  + Logger.Ok,
  + Logger.Trace,
  + Logger.Wait,
  + Logger.Warn,
+ INFO
  + Logger.Info
  + Logger.Ok
  + Logger.Error


## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg
[types.json]: https://github.com/darwinia-network/darwinia/blob/master/runtime/crab/types.json
