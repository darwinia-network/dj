import EventStarter from "./Starter";

const eventStarter = new EventStarter();
eventStarter.start({
  "RPC_SERVER": "https://ropsten.infura.io/v3/xx",
  "START_BLOCK_NUMBER": 8609800,
  "CONTRACT": {
    "RING": {
      "address": "0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0",
      "burnAndRedeemTopics": "0xc9dcda609937876978d7e0aa29857cb187aea06ad9e843fd23fd32108da73f10"
    },
    "KTON": {
      "address": "0x1994100c58753793D52c6f457f189aa3ce9cEe94",
      "burnAndRedeemTopics": "0xc9dcda609937876978d7e0aa29857cb187aea06ad9e843fd23fd32108da73f10"
    },
    "BANK": {
      "address": "0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e",
      "burnAndRedeemTopics": "0xe77bf2fa8a25e63c1e5e29e1b2fcb6586d673931e020c4e3ffede453b830fb12"
    },
    "ISSUING": {
      "address": "0x49262B932E439271d05634c32978294C7Ea15d0C"
    }
  }
}, (tx: any) => {
  console.log('test::callback:',tx)
});