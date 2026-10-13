# Security boundary and limitations

Micro Compound is deliberately a simulator. Do not add private exchange endpoints, chain signers, wallet private keys or real-fund features to the default branch.

The `Wallet` class stores only **synthetic USD values**. Its symbol holdings do not represent a funded on-chain address. No `seed`/secret/private key should be supplied, uploaded, prompted for or stored. Never reuse public Anvil development accounts on mainnet.

`public` mode pulls third-party HTTP **GET** endpoints and may be delayed, unavailable or misleading. It cannot guarantee token sellability or executable liquidity. Do not treat public JSON as trusted HTML: the dashboard renders user-derived fields as `textContent`. The system neither identifies rug pulls with certainty nor proves profits.

Publishing static reports potentially exposes research preferences and market symbols, so review before making any output public. CI must never publish credentials or individual addresses.

The simple no-live primitive test flags selected forbidden strings, **but is not a complete security audit**. Human code review and dependency audits remain necessary for further versions.