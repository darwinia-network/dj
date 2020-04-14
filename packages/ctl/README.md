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
dactle <hello@darwinia.network>

Commands:
  dactle config [edit]  show config
  dactle crash          keep sending txes to ethereum and save the container
                        blocks
  dactle fetcher        keep fetching eth blocks to local storage
  dactle relay          keep relaying eth headers to darwinia

Options:
  --help, -h     Show help                                             [boolean]
  --version, -V  Show version number                                   [boolean]
```

## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg
