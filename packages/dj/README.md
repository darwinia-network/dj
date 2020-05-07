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
dj <hello@darwinia.network>

Commands:
  dj info <recipe>                Get balance of darwinia account
  dj config [edit]                show config
  dj keep <service>               trigger services
  dj relay [block]                Relay eth header to darwinia
  dj transfer <address> <amount>  Transfer to darwinia account

Options:
  --help, -h     Show help                                             [boolean]
  --version, -V  Show version number                                   [boolean]
```

## Connect to Offchain worker(Migrate to dactle next version)
- `dj` can provides a shadow service can help validators validating things
- The shadow service may run on the same node or on a differet node, at any port as you like.
- The offchain worker make the request to `eth-resource` host at standard http port 80


Here is the example to connect a shadow service running on port 8000 on the same node with Linux OS
- point the `eth-resource` host name to 127.0.0.1, you also customized this with other DNS services
  1. `# echo '127.0.0.1        eth-resource' >> /etc/hosts`
- proxy request on 80 port to 8000 port, only if the shadow service is not running on the 80 port
  1. install Nginx
  1. add following settings to config file
    ```
      server {
          listen       eth-resource:80;
          server_name  eth-resource;
          location / {
              proxy_pass http://127.0.0.1:8000;
          }
      }
    ```
  1. start the Nginx
  
## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg
