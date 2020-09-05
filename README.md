# @darwinia/dj

[![Node.js CI][workflow-badge]][github]

## **Introduction**

`dj` is the CLI tool for Darwinia Bridge, which is a cross-chain bridge currently supports bidirectional cross chain relay between Ethereum and Darwinia.

Darwinia supports the cross-chain bridge of Ethereum by implementing an Ethereum light client(Darwinia ChainRelay) on its chain. Therefore, someone needs to submit the Ethereum block headers to this light client. `dj` is such a tool, anyone can use it to submit block headers to the Ethereum light client on Darwinia and get rewards.

## **Prerequisites**

- [nodejs](https://nodejs.org/en/)

    It is recommended to use nvm for installing nodejs. version 8.x and above will be better.

- yarn
- A `seed` used to sign and send extrinsics. The easiest way is to generate an account in the [web wallet](https://apps.darwinia.network/) and write down the `mnemonic seed` during the generation process. For more information, please refer to this [tutorial](https://www.notion.so/Substrate-Darwinia-902206fd926a4c5799191bc9ae5efacf?p=119a79a1a0454902a4eb65f1e4de5db9&showMoveTo=true).
- (Optional) docker
- (Optional) A local darwinia crab network node if you want to test with a local node.

## **Installation**

```bash
yarn global add @darwinia/dj
```

Now you can type `dj` in your command-line:

```bash
> dj
dj <hello@darwinia.network>

Commands:
	dj balance [address]            Get balance of account address
  dj config [edit]                Show config
  dj proposal <block>             Submit a relay proposal to darwinia
  dj transfer <address> <amount>  Transfer RING to darwinia account

Options:
  --help, -h     Show help                                             [boolean]
  --version, -V  Show version number
```

## Usage

By default, `dj` is configured to point to the Infura Ethereum node and the official Darwinia crab network node. So you can immediately start using `dj` to submit Ethereum block headers to the Darwinia crab network and get rewards. 

```bash
dj
```

When the `dj` command is executed for the first time, you will be asked to input a seed. At this time, you need to enter the seed you have prepared and press Enter to continue.

You can see the submission result in a few minutes. If `ok` appears, it means the submission is successful. If `reject` appears, xxx.

### Util subcommands

- dj proposal <block>

    Submit a proposal  to darwinia network. The proposal includes the target block header with its proof.

- dj balance

    Get the `RING` balance of your seed account.

- dj transfer <address> <amount>

    Transfor `RING` to `address` from your seed account

- dj config

    Show your `dj`'s current config.

### Change seed

If you want to change your seed, you need to find the configuration file `<your home directory>/.darwinia/config.json` . Open this file with an editor, replace the original seed and save it.

For more information about configuration, see the configuration section.

## Configuration

As mentioned earlier,  `dj` configuration file is `<your home directory>/.darwinia/config.json`, there are three configuration items:

- node

    darwinia node websocket url.

- seed

    `seed` used to sign and send extrinsics by `dj`

- shadow

    shadow proposal endpoint ur

    shadow is a service for `dj` to fetch ethereum headers with proof. 

    For more information about shadow, see the Shadow service section.

## If you like local Darwinia crab network node

1. Run node

    It is recommended to use docker to run Darwinia node.

    Find the latest version from the [releases](https://github.com/darwinia-network/darwinia/releases), and then pull its docker image.

    ```bash
    docker pull darwinianetwork/darwinia:v0.6.7
    ```

    After the image is successfully pulled, run:

    ```bash
    docker run -it -p 9944:9944 darwinianetwork/darwinia:v0.6.7 --chain crab --rpc-methods=unsafe --rpc-external=true --ws-external=true --rpc-cors=all
    ```

    Now, you got a local node running locally, and wait for the sync to complete.

2. Edit `dj`'s `.darwinia/config.json`to point it to your local node

    Open the file with an editor and replace the `node` with `ws://127.0.0.1:9944` and save it.

    ```bash
    {
      "node": "ws://127.0.0.1:9944",
    	"seed": "...",
      "shadow": "..."
    }
    ```

## Rewards

*Under development, currently not supported*

## Shadow service

Shadow is a service used by `dj` to retrieve header data and generate proof. Shadow will index the data it needs from blockchain nodes, such as Ethereum and Darwinia.

`dj` uses the official shadow service by default, if you don’t want to use the official service, you can run the service yourself, and then configure `dj` to use it. 

- Install

    ```bash
    # install rust and cargo
    $ curl https://sh.rustup.rs -sSf | sh

    # install shadow
    $ cargo install darwinia-shadow
    ```

- Run

    ```bash
    shadow run --verbose --fetch
    ```

- Edit `dj`'s `.darwinia/config.json`to point it to your local shadow service

    ```bash
    {
      "node": "...",
    	"seed": "...",
      "shadow": "http://0.0.0.0:3000/api/v1"
    }
    ```

## Setup and run a dev environment

1. Run your darwinia node in dev

    ```bash
    docker run -it -p 9944:9944 darwinianetwork/darwinia:v0.6.7 --chain crab-dev --rpc-methods=unsafe --rpc-external=true --ws-external=true --rpc-cors=all
    ```

2. Run your shadow service

    ```bash
    shadow run --verbose --fetch
    ```

3. Configure your dj

    Edit your `.darwinia/config.json`

    ```json
    {
      "node": "ws://0.0.0.0:9944",
    	"seed": "//Alice",
      "shadow": "http://0.0.0.0:3000/api/v1"
    }
    ```

4. Run dj to submit header to your local dev node

    ```bash
    dj
    ```

## Theory

Darwinia ChainRelay is a sub-linear light client, which means it does not store every block header of the blockchain it monitors. When initialized, it contains only one block, which is the genesis block. When a relayer submits a new block header, it might be the block header of height 10,000 or even higher. There are huge blanks in-between. If another relayer does not agree and submits a different block header claiming that's the block header data at the height of 10,000. How does ChainRelay resolve this conflict, and who is going to be the judge?

Once a block header is submitted, it provides block header hash and its mmr_root of all previous block header hashes till genesis block. Therefore, if a block header submission is in question, ChainRelay will challenge the relayer for a prior block header data or more specified by a sampling function. That block header hashes must be a leaf or leaves of previously submitted mmr_root. In this way, if an adversary tries to fool ChainRelay, he must prepare the whole chain, while each block must comply with consensus rule. The attack difficulty equals attacking the original blockchain network.

Ethereum Relay on Darwinia can verify specific transactions of Ethereum based on mmr_root, such as redeem of RING, KTON and deposit.

The redeem of KTON and RING is in the Issuing contract, and the redeem of the deposit is in the burnAndRedeem method of the GringottsBankV2 contract. BurnAndRedeem token need to pay the bridge fee, the basic token of the fees is RING. Therefore, it is necessary to approve a amount of RING to the Issuing contract before operation to ensure execution of the contract. Ethereum Relay on Darwinia confirms the amount of redeem, receiver, sender, etc. through the tx events in the verification.

------------

#### The format of Events

- RING，KTON

```bash
event BurnAndRedeem(address indexed token, address indexed from, uint256 amount, bytes receiver);
```
The event is generated at Issuing [0x49262B932E439271d05634c32978294C7Ea15d0C](https://ropsten.etherscan.io/address/0x49262B932E439271d05634c32978294C7Ea15d0C "0x49262B932E439271d05634c32978294C7Ea15d0C")

- Deposit
```bash
event BurnAndRedeem(uint256 indexed _depositID,  address _depositor, uint48 _months, uint48 _startAt, uint64 _unitInterest, uint128 _value, bytes _data);
```
The event is generated at GringottsBankV2 [0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e](https://ropsten.etherscan.io/address/0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e "0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e")

#### Ropsten Contract Address
- RING: [0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0](https://ropsten.etherscan.io/address/0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0 "0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0")
- KTON: [0x1994100c58753793D52c6f457f189aa3ce9cEe94](https://ropsten.etherscan.io/address/0x1994100c58753793D52c6f457f189aa3ce9cEe94 "0x1994100c58753793D52c6f457f189aa3ce9cEe94")
- GringottsBankV2: [0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e](https://ropsten.etherscan.io/address/0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e "0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e")
- Issuing: [0x49262B932E439271d05634c32978294C7Ea15d0C](https://ropsten.etherscan.io/address/0x49262B932E439271d05634c32978294C7Ea15d0C "0x49262B932E439271d05634c32978294C7Ea15d0C")

#### Tx on the Ethereum ropsten test network
- Redeem RING
https://ropsten.etherscan.io/tx/0x1d3ef601b9fa4a7f1d6259c658d0a10c77940fa5db9e10ab55397eb0ce88807d
- Redeem KTON
https://ropsten.etherscan.io/tx/0x2878ae39a9e0db95e61164528bb1ec8684be194bdcc236848ff14d3fe5ba335d
- Redeem Deposit
https://ropsten.etherscan.io/tx/0x5a7004126466ce763501c89bcbb98d14f3c328c4b310b1976a38be1183d91919

#### Contract
- https://github.com/evolutionlandorg/common-contracts/blob/master/contracts/Issuing.sol

- https://github.com/evolutionlandorg/bank/blob/master/contracts/GringottsBankV2.sol

## Contributing

### Environment

`dj` is a typescript project. You need to install `nodejs`, `yarn` and `ts-node` and ready to go.

### Run

```shell
git clone https://github.com/darwinia-network/dj.git
cd dj
yarn install
ts-node index.ts help
# run dj
ts-node index.ts
# run dj subcommand
ts-node index.ts config
```

### Bugs

We are using [GitHub Issues](https://github.com/darwinia-network/dj/issues) for bug tracking. 

Before you report a bug, please make sure you've searched existing issues.

### Contributing Guidelines

[CONTRIBUTING.adoc](https://github.com/darwinia-network/dj/blob/master/CONTRIBUTING.adoc)

## LICENSE

GPL-3.0

[github]: https://github.com/darwinia-network/dj
[workflow-badge]: https://github.com/darwinia-network/darwinia.js/workflows/nodejs/badge.svg
