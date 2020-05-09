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

The config part is shared with all projects building with `darwinia.js`, 
we strongly recommand you to read this sample before you starting your
`darwinia.js` trip!

```json
// ~/.darwinia/config.json
{
  "shadow": "shadow service api, refer github.com/darwini-network/darwinia.go",
  "node": "darwinia node, should start with `ws://` or `wss://`, eg: ws://0.0.0.0:9944",
  "seed": "darwinia account seed, eg: //Alice"
}
```

### For Developers

If you want to use `darwinia.js` developing your own `darwinia.js` based apps, you might
want to try `@darwinia/api` and `@darwinia/util`.


### For Testers and Users

If you want to test Darwinia using `darwinia.js`, check the `@darwinia/dj` project.


## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg
[types.json]: https://github.com/darwinia-network/darwinia/blob/master/runtime/crab/types.json
