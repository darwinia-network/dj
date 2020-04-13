<h1 align="center">
𝒹𝒶𝓇𝓌𝒾𝓃𝒾𝒶.𝒿𝓈
</h1>

## SPEC

High-level darwinia.js api

## Usage

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
| reset      | (block: string/number)         | res: ExResult   |
| relay      | (block: string/number)         | res: ExResult   |
| transfer   | (addr: string, amount: number) | res: ExResult   |
| redeem     | (receipt: IReceipt)            | res: ExResult   |


## LICENSE

GPL-3.0

[types.json]: https://github.com/darwinia-network/darwinia/blob/master/runtime/crab/types.json
