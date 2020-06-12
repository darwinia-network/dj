# Relayer Game

The implemetation of darwinia relayer game.

| Lang       | Mode          |
|------------|---------------|
| Javascript | Proposal Only |

## APIs

| Method    | Args                                                         | Resp         | Desc                   |
|-----------|--------------------------------------------------------------|--------------|------------------------|
| `/relay`  | `(header: DarwiniaEthHeader, proof: EtHashProof, mmr: Hash)` | Tx Result    | Relay block            |
| `/status` | `(height?: u64, hash?: Hash)`                                | Relay Status | Get the current status |


