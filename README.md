<h1 align="center">
𝒹𝒶𝓇𝓌𝒾𝓃𝒾𝒶.𝒿𝓈
</h1>

[![Node.js CI][workflow-badge]][github]

## SPEC

Gather common javascript usages for darwinia.


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
  "node": "ws://0.0.0.0:9944",   // darwinia node, should start with `ws://`
  "seed": "//Alice"              // darwinia account seed
}
```


### For Developers

If you want to use `darwinia.js` developing your own `darwinia.js` based, you might
want to try `@darwinia/api` and `@darwinia/util`.


### For Testers and Users

If you want to test darwinia using `darwinia.js`, check the `@darwinia/dj` project.


## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg
[types.json]: https://github.com/darwinia-network/darwinia/blob/master/runtime/crab/types.json
