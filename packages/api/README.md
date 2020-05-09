# @darwinia/api

[![Node.js CI][workflow-badge]][github]

## SPEC

High-level darwinia.js api

## Usage

```
yarn add @darwinia/api
```

```javascript
import { autoAPI } from "@darwinia-network/darwinia.js";

(async () => {
    const api = await autoAPI();
    const balance = await api.getBalance(api.account.address);
    log(balance);
})();
```

| method     | params                         | return          |
|------------|--------------------------------|-----------------|
| getBalance | (addr: string)                 | balance: string |
| relay      | (block: string/number)         | res: ExResult   |
| transfer   | (addr: string, amount: number) | res: ExResult   |
| redeem     | (receipt: IReceipt)            | res: ExResult   |


## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/darwinia.js
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/Node.js%20CI/badge.svg

