# @darwinia/dj

[![Node.js CI][workflow-badge]][github]

darwinia.js command-line tools

## Usage

Install `dj` globally

```shell
# for stable version
yarn global add @darwinia/dj

# for lastest version
yarn global add @darwinia/dj@next
```

Input <kbd>dj</kbd> to your command-line.

```text
dj <hello@darwinia.network>

Commands:
  dj info <recipe>                Get info of recipes
  dj config [edit]                Show config
  dj relay [block]                Relay eth header to darwinia
  dj transfer <address> <amount>  Transfer to darwinia account

Options:
  --help, -h     Show help                                             [boolean]
  --version, -V  Show version number                                   [boolean]
```
  
## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg
