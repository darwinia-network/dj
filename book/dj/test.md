# How to test dj locally?

## 1. Run your darwinia node

You can [download][darwinia-releases] the lastest `darwinia` binary or [build][build-darwinia] a `darwinia` node yourselves.

```shell
# Remove the old db
$ darwinia purge-chain --dev

# Start the node
$ darwinia --dev
```

## 2. Run your shadow service

Download and build `shadow` service, the guide is [here][shadow-guide].

```shell
$ shadow run --verbose --fetch
```

## 3. Configure your dj

Edit your `.darwinia/config.json`

```json
{
  "node": "ws://0.0.0.0:9944",
  "shadow": "http://0.0.0.0:3000/api/v1",
  "seed": "//Alice"
}
```

## 4. Install && Run dj

Install the canary version `dj`

```
$ yarn global add @darwinia/dj@canary
```

Run `dj`

```
$ dj 
dj <hello@darwinia.network>

Commands:
  dj balance [address]            Get balance of account address
  dj codec <block>                Get info of recipes
  dj config [edit]                Show config
  dj proposal <block>             Submit a relay proposal to darwinia
  dj relay [number] [batch]       Relay eth header to darwinia
  dj transfer <address> <amount>  Transfer RING to darwinia account
  dj tx <hash>                    Get tx by hash

Options:
  --help, -h     Show help                                             [boolean]
  --version, -V  Show version number                                   [boolean]
```

## Example -- How to test ethereum relay?

```
$ dj proposal 19
```


[shadow-guide]: https://github.com/darwinia-network/shadow#getting-started
[build-darwinia]: https://github.com/darwinia-network/darwinia#4-building
[darwinia-releases]: https://github.com/darwinia-network/darwinia/releases
