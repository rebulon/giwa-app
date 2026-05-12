# Tempo App

A web3 application built on [Tempo Moderato testnet](https://tempo.xyz) — a payments-first blockchain with instant finality and stablecoin-native gas.

**Live demo:** https://tempo-colonism.vercel.app

## Features

- **Passkey authentication** — create a wallet via Face ID, Touch ID, or Windows Hello (WebAuthn/P256), no seed phrase required
- **Dashboard** — view balances across all TIP-20 stablecoins
- **Tokens** — create and manage TIP-20 tokens via the factory contract
- **DEX** — swap stablecoins on Tempo's native Stablecoin DEX (market and limit orders)
- **Pay** — send payments with memo fields for reconciliation
- **Faucet** — claim testnet tokens (pUSD, aUSD, bUSD, tUSD)
- **Ask AI** — built-in AI assistant

## Stack

- React 18 + Vite
- wagmi v3 + viem v2 + ethers v6
- WebAuthn / passkey signing (`@simplewebauthn`)
- Tempo Moderato testnet — chain ID 42431

## Network

| Parameter | Value |
|-----------|-------|
| Network | Tempo Moderato Testnet |
| Chain ID | 42431 |
| RPC | https://rpc.moderato.tempo.xyz |
| WSS | wss://rpc.moderato.tempo.xyz |
| Explorer | https://explore.tempo.xyz |
| Faucet | https://faucet.moderato.tempo.xyz |

## Predeployed Contracts

| Contract | Address |
|----------|---------|
| TIP-20 Factory | `0x20fc000000000000000000000000000000000000` |
| Stablecoin DEX | `0xdec0000000000000000000000000000000000000` |
| Fee Manager | `0xfeec000000000000000000000000000000000000` |
| TIP-403 Registry | `0x403c000000000000000000000000000000000000` |
| Keychain | `0x0000000000000000000000000000000000000801` |

## Getting Started

```bash
npm install
npm run dev
```

Or run with the key manager server:

```bash
npm run dev:all
```

## Related

- [Tempo Docs](https://docs.tempo.xyz)
- [Tempo Blog](https://tempo.xyz/blog)
