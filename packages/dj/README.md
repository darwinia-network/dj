# @darwinia/dj

[![Node.js CI][workflow-badge]][github]

darwinia.js command-line tools

## Usage

Install `dj` globally

```shell
yarn global add @darwinia/dj
```

Input <kbd>dj</kbd> to your command-line.

```text
 𝝺 ts-node index.ts 
dj <hello@darwinia.network>

Commands:
  dj balance [address]            Get balance of account address
  dj codec <block>                Get info of recipes
  dj config [edit]                Show config
  dj relay [block]                Relay eth header to darwinia
  dj transfer <address> <amount>  Transfer RING to darwinia account
  dj tx <hash>                    Get tx by hash

Options:
  --help, -h     Show help                                             [boolean]
  --version, -V  Show version number                                   [boolean]
```
  
## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg
