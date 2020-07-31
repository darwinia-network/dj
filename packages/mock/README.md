## Mock the Relayer Game

### Build 

```shell
# If using npm
$ npm i

# If using yarn
$ yarn
```

### Step-1

...Purge-chain and start dev darwinia chain (version > 0.6.3)

```
$ darwinia purge-chain --dev
$ darwinia --dev
```

### Step-2

Start the honest relayer

```shell
$ ts-node honest.ts
[ event ]: This is the honest relayer
*** 
*** You are using the node-template, depending on your config and age of the template, you may
*** have some unexpected results without applying the correct config for your node type:
*** 
*** - If you have trouble sending txs, apply https://polkadot.js.org/api/start/FAQ.html#i-cannot-send-transactions-from-my-node-template-based-chain
*** - If you have trouble parsing events, apply https://polkadot.js.org/api/start/FAQ.html#using-a-non-current-master-node-i-have-issues-parsing-events
*** 
2020-07-29 16:52:08        API/INIT: RPC methods not decorated: balances_usableBalance, headerMMR_genProof, staking_powerOf
Unable to resolve type Status, it will fail on construction
Unknown signed extensions CheckEthereumRelayHeaderHash found, treating them as no-effect
Unknown signed extensions CheckEthereumRelayHeaderHash found, treating them as no-effect
Unknown types found, no types for Status
```

### Step-3

Start the uncle relayer

```shell
$ ts-node uncle.ts
[ event ]: This is the uncle relayer
*** 
*** You are using the node-template, depending on your config and age of the template, you may
*** have some unexpected results without applying the correct config for your node type:
*** 
*** - If you have trouble sending txs, apply https://polkadot.js.org/api/start/FAQ.html#i-cannot-send-transactions-from-my-node-template-based-chain
*** - If you have trouble parsing events, apply https://polkadot.js.org/api/start/FAQ.html#using-a-non-current-master-node-i-have-issues-parsing-events
*** 
2020-07-29 16:52:46        API/INIT: RPC methods not decorated: balances_usableBalance, headerMMR_genProof, staking_powerOf
```
