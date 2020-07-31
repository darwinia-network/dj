# @darwinia/util

[![Node.js CI][workflow-badge]][github]

## SPEC

Utils for developing darwinia javascript library.


### Usage

```
yarn add @darwinia/api
```

```javascript
import { API, Config } from "@darwinia-network/util";

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
// ~/.darwinia/config.json
{
  "shadow": "shadow service api, refer github.com/darwini-network/darwinia.go",
  "node": "darwinia node, should start with `ws://` or `wss://`, eg: ws://0.0.0.0:9944",
  "seed": "darwinia account seed, eg: //Alice"
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
[types.json]: https://github.com/darwinia-network/darwinia/blob/master/runtime/crab/darwinia_types.json
