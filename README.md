k# Thahar Protocol — थाहर

> *Thahar (थाहर) — Nepali for "stable ground"*

Parametric crop and disaster insurance on Solana for Nepali smallholder farmers.
Farmers pay micro-premiums in USDC. Weather oracles trigger automatic payouts in seconds.
No claim forms. No middlemen. No waiting.

---

## The Problem

4 million farming households in Nepal have no crop insurance.
When floods hit the Terai or drought kills a hill harvest — relief takes weeks through
corrupt channels, if it arrives at all. Families lose everything waiting for a system
that was never built for them.

## The Solution

Thahar Protocol replaces the claims process with code.

- Farmer registers a policy and pays a micro-premium in USDC
- On-chain oracle monitors rainfall and flood level data
- Threshold breached → smart contract releases payout to farmer wallet automatically
- Every transaction is public, transparent, and unstoppable

**400 milliseconds. Not 4 weeks.**

---

## How It Works
Farmer registers policy
↓
Pays micro-premium in USDC → locked in PDA escrow
↓
Oracle monitors: rainfall_mm / flood_level_cm
↓
Threshold breached?
YES → payout released to farmer wallet automatically
NO  → premium returned at season end

---

## Insurance Types

| Type | Trigger | Oracle Source |
|------|---------|---------------|
| Crop Insurance | Rainfall below X mm for Y days | DHM Nepal + NASA CHIRPS satellite |
| Disaster Insurance | Flood level exceeds X cm | DHM river gauge stations |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Solana |
| Smart Contract | Rust + Anchor Framework |
| Stablecoin | USDC (SPL Token) |
| Frontend | React + Tailwind CSS + Wallet Adapter |
| Backend | FastAPI + PostgreSQL |
| Oracle | DHM Nepal API + NASA CHIRPS (mock for devnet) |

---

## Architecture
Farmer Wallet
↓ pay_premium (USDC)
PDA Escrow Account
↑ trigger_payout
Oracle Account ← update_oracle (DHM / CHIRPS data)
↑
Program Treasury (seeded by protocol)

---

## Smart Contract Instructions

| Instruction | Description |
|-------------|-------------|
| `register_policy` | Creates InsurancePolicy PDA for farmer |
| `pay_premium` | Transfers USDC from farmer to escrow |
| `update_oracle` | Updates rainfall/flood readings on-chain |
| `trigger_payout` | Checks threshold, releases USDC to farmer |

---

## Fraud Prevention Architecture

- **Multi-source oracle**: 2-of-3 consensus required (DHM + CHIRPS + IoT sensor)
- **Land verification**: Cross-referenced with Malpot (Nepal Land Revenue Office) records
- **Identity layer**: NID (Nepal National Identity Card) integration designed for production
- **USDC denomination**: Premiums and payouts in stablecoin, not volatile SOL

---

## Roadmap

- **Phase 1 (Now):** Crop + disaster insurance on Solana devnet
- **Phase 2:** Livestock insurance via RFID tag oracle
- **Phase 3:** Migrant worker accident insurance via embassy verification
- **Phase 4:** Cooperative partnership for licensed real-world deployment

---

## Why Solana

A $3 USDC micro-premium cannot survive Ethereum gas fees.
On Solana it works. Sub-second finality means payout before the farmer
knows he has a claim.

---

## Built For

Colosseum Hackathon 2026
Built by Sewang Rai — Kathmandu, Nepal
