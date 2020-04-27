<h1 align="center">
𝒹𝒶𝓇𝓌𝒾𝓃𝒾𝒶.𝒿𝓈
</h1>

[![Node.js CI][workflow-badge]][github]

## SPEC

Gather common javascript usages for [Darwinia Network](https://darwinia.network).


| type      | name                                        |
|-----------|---------------------------------------------|
| cmd-tools | [@darwinia/dj](./packages/dj/README.md)     |
| library   | [@darwinia/api](./packages/api/README.md)   |
| library   | [@darwinia/util](./packages/util/README.md) |


### Config

The config part is used by all projects building with `darwinia.js`, 
we strongly recommand you to read this sample before you starting your
`darwinia.js` trip!

```json
// ~/.darwinia/dj.json
{
  "eth": {
    "node": "",                  // ethereum node url, you can input an infura url
    "secret": ""                 // ethereum secret key, used for crash service
  },
  "grammer": {                   // this field is for grammer server
    "commands": {
      "faucet": {
        "supply": 400,
        "amount": 1000,
        "interval": 24
      }
    },
    "port": 1439
  },
  "node": "ws://0.0.0.0:9944",   // darwinia node, should start with `ws://` or `wss://`
  "seed": "//Alice"              // darwinia account seed
}
```


### For Developers

If you want to use `darwinia.js` developing your own `darwinia.js` based apps, you might
want to try `@darwinia/api` and `@darwinia/util`.


### For Testers and Users

If you want to test Darwinia using `darwinia.js`, check the `@darwinia/dj` project.

### Connect to Offchain worker
- The `darwinia.js` can provide a shadow service to help validators validate things
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
[types.json]: https://github.com/darwinia-network/darwinia/blob/master/runtime/crab/types.json
