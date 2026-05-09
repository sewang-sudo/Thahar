# Thahar Protocol — थाहर
> *Thahar (थाहर) — Nepali for "stable ground"*

Parametric crop insurance on Solana for Nepali smallholder farmers.
No banks. No claim forms. No middlemen. Just code.

---

## The Problem

Over 2 million farming households in Nepal have no crop insurance.
When drought hits — there is no safety net. Relief takes weeks through
systems that were never built for people like my family.

Between 2021 and 2024, Nepal's cooperative crisis unfolded across 266 cooperatives.. Tens of thousands of depositors —
farmers, daily wage earners, retirees — lost their savings when cooperative funds
were illegally diverted into private businesses. My family were among the victims.

That experience taught me one thing: when you trust humans with money, humans can steal it.

Thahar doesn't solve cooperative fraud directly. But it solves the deeper problem —
when drought hits a Nepali farmer, they depend on government relief, cooperative loans,
or insurance companies that don't exist for people like them. Every one of those systems
requires trusting a human with your money and your survival.

Thahar removes that trust requirement entirely. Premiums are locked in a smart contract.
Payouts are triggered by real rainfall data — not a bureaucrat, not an insurance adjuster,
not a cooperative chairman. The code decides. Nobody can redirect it, delay it, or steal it.

Not because of rules. Because of code.

---

## Live Links

| | |
|---|---|
| Frontend | https://thahar.vercel.app |
| Domain | thahar.com.np (registration pending — applied) |
| Program ID | `3o7dXUGpic6U7AsCpEwv4ifVp4w2B4waHk3ScbjT1NU2` |
| Network | Solana Devnet |
| Blink | https://dial.to/?action=solana-action:https://zonal-victory-production-61b3.up.railway.app/api/blink |
| Blink Endpoint | https://zonal-victory-production-61b3.up.railway.app/api/blink |

---

## How It Works

```
Farmer registers policy via frontend or Solana Blink
↓
Pays micro-premium in SOL → locked in treasury PDA
↓
Oracle crank fetches real rainfall data from Open-Meteo API
↓
Pushes rainfall_mm on-chain every 12 hours
↓
Threshold breached → trigger_payout releases SOL to farmer wallet
↓
No middleman can touch the funds. Not even me.
```

---

## Solana Blink

Register a crop insurance policy directly from any Blink-compatible platform:

```
https://dial.to/?action=solana-action:https://zonal-victory-production-61b3.up.railway.app/api/blink
```

Select your district, select coverage amount, sign — done.

---

## Crop Risk Advisor

Farmers select their region, crop type, and season to get an instant risk assessment.
The advisor fetches live on-chain oracle data and calculates:

- Risk level (High / Medium / Low) based on real rainfall readings
- Recommended coverage amount in SOL
- Drought trigger threshold for their specific crop and season
- One-click policy registration with pre-filled values

No AI black box — pure logic based on real data. Transparent and auditable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Solana Devnet |
| Smart Contract | Rust + Anchor Framework |
| Oracle Data | Open-Meteo API (real rainfall) |
| Oracle Pusher | Node.js crank — runs every 12 hours |
| Blink Server | Express.js on Railway |
| Frontend | React + Wallet Adapter on Vercel |
| Risk Advisor | Rule-based JS logic on live oracle data |

---

## Smart Contract Instructions

| Instruction | Description |
|---|---|
| `register_policy` | Creates InsurancePolicy PDA for farmer |
| `pay_premium` | Transfers SOL from farmer to treasury PDA |
| `update_oracle` | Pushes real rainfall readings on-chain |
| `trigger_payout` | Checks threshold, releases SOL to farmer automatically |
| `close_policy` | Closes policy and returns rent to farmer |
| `expire_policy` | Marks policy expired at season end |

---

## Insurance Logic

- Farmer sets a rainfall threshold (mm) at registration
- Oracle crank fetches real data from Open-Meteo for Kathmandu, Khotang, and Chitwan
- If `rainfall_mm < trigger_threshold` → payout releases automatically
- Oracle data older than 24 hours is rejected — cannot trigger payout
- Policy must be at least 7 days old before payout can trigger

---

## Regions Supported

| Region | Province |
|---|---|
| Kathmandu | Bagmati Province |
| Khotang | Koshi Province |
| Chitwan | Bagmati Province |

---

## Known Limitations

- Oracle pusher is a single authorized wallet — centralized weakness
- Next step: Switchboard or Pyth decentralized oracle integration
- Devnet only — mainnet pending Nepal regulatory clarity
- One policy per wallet at this stage

---

## Project Structure

```
Thahar/
├── anchor-program/     # Rust + Anchor smart contract
├── frontend/           # React frontend
│   └── src/
│       ├── pages/      # Home, Oracle, MyPolicies, Admin
│       ├── components/ # Reusable UI components
│       ├── utils/      # Thahar program utils, wallet helpers
│       ├── styles/     # Theme and global CSS
│       └── hooks/      # Custom React hooks
├── blinks/             # Solana Actions + Blink server
├── crank/              # Oracle crank — fetches real rainfall data
└── scripts/            # Utility scripts
```

---

## Live Services

| Service | Host | URL |
|---|---|---|
| Frontend | Vercel | https://thahar.vercel.app |
| Blink server | Render | https://thahar-blinks.onrender.com |
| Oracle crank | Render | Runs every 12 hours automatically |

---

## Built For

Colosseum Frontier Hackathon 2026

Built solo by Sewang Rai — from Bhulke, Khotang. Based in Kathmandu.
17 years old student. Built during exam season — because some problems can't wait.