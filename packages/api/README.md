# @darwinia/api

[![Node.js CI][workflow-badge]][github]

## SPEC

High-level darwinia.js api

## Usage

```
yarn add @darwinia/api
```

If you have global config at `~/.darwinia/config.json`

```javascript
import { autoAPI } from "@darwinia/api";

(async () => {
    const api = await autoAPI();
    const balance = await api.getBalance(api.account.address);
    log(balance);
})();
```

| method       | params                         | return       |
|--------------|--------------------------------|--------------|
| getBalance   | (addr: string)                 | string       |
| relay        | (block: string/number)         | ExResult     |
| transfer     | (addr: string, amount: number) | ExResult     |
| redeem       | (receipt: IReceipt)            | ExResult     |
| getBlock     | (block: number or string       | SingendBlock |
| getExtrinsic | (hash: string)                 | Extrinsic    |


## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg

