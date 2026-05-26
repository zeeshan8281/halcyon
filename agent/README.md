# Halcyon — Agentic Micro Hedge Fund

Autonomous hedge fund manager. Holds its own keys inside an EigenCompute TEE.
Runs a public Hyperliquid vault — anyone in the world can deposit USDC.
Trades the long tail. Narrates every move publicly. Ships with a live dashboard.

The character is the product. The TEE is the trust. The vault is the hedge fund.

## Tech stack

**Backend** — Node 22, TypeScript, ESM. `@anthropic-ai/sdk` (Claude),
`hyperliquid` (nktkas SDK, vault-aware), `viem` (keypair), `twitter-api-v2`,
`dotenv`. HTTP via built-in `node:http`. Storage = JSONL files, no database.

**Frontend** — Vite + React 18 + TypeScript + Tailwind. Custom dark-terminal
theme. Polls `/api/state` every 3s. Lives in `frontend/`.

**Container** — Multi-stage `linux/amd64`. Builds frontend, builds backend,
ships both in a single Node 22 slim image. Drop-in for EigenCompute TDX.

## Setup

You need:
- an Anthropic API key
- a Hyperliquid leader wallet funded with USDC (testnet has a faucet)

```bash
npm install
npm --prefix frontend install

# 1. Create the vault
#    https://app.hyperliquid-testnet.xyz/vaults  (or mainnet)
#    Click "Create Vault" — name it, add description, seed it with USDC.
#    Copy the vault address.

# 2. Generate the agent keypair
npm run gen-key
#    → prints HL_AGENT_PRIVATE_KEY=0x... and the agent address.

# 3. Approve the agent on Hyperliquid (from the leader wallet)
#    https://app.hyperliquid-testnet.xyz/API
#    Authorize the agent address.

# 4. Configure .env
cp .env.example .env
# fill:
#   ANTHROPIC_API_KEY
#   HL_NETWORK=testnet
#   HL_AGENT_PRIVATE_KEY (from step 2)
#   HL_LEADER_ADDRESS    (your leader wallet)
#   HL_VAULT_ADDRESS     (from step 1)
```

## Run it

**Production-style (single port, served bundle):**
```bash
npm run start
# builds the frontend, then runs the agent + backend on :8080
# → open http://localhost:8080
```

**Dev mode (hot reload, two ports):**
```bash
npm run dev
# backend on :8080 (tsx watch)
# Vite on :5173 (with /api proxy to :8080)
# → open http://localhost:5173
```

## Project layout

```
src/                 backend (TypeScript)
  index.ts           main loop: read market → decide → trade → post → sleep
  config.ts          env + symbol normalization (-PERP suffix)
  venue.ts           HyperliquidVenue — passes vaultAddress on every order
  brain.ts           Claude API call: takes vault+market context, returns JSON
  poster.ts          Twitter post (or dry-run log)
  persona.ts         the agent's system prompt — the character
  log.ts             append-only jsonl event log
  server.ts          serves frontend/dist + GET /api/state
  types.ts           shared backend types

frontend/            React + Vite + TS + Tailwind
  index.html         entry
  vite.config.ts     dev server with /api proxy
  tailwind.config.js custom theme (dark terminal)
  src/
    App.tsx          layout + polling
    main.tsx         entry
    api.ts           typed fetch
    types.ts         mirrors backend types
    utils/format.ts  fmt helpers
    components/      Header, VaultBar, Panel, AccountPanel,
                     PositionsTable, MarketTable, DecisionsFeed,
                     TweetsFeed, DepositorsTable, TradesFeed

bin/
  gen-key.mjs        fresh agent keypair (npm run gen-key)
```

## Security model

- **Leader (cold)** — owns the vault, approved the agent. Only the leader
  can move funds in/out of the vault. Should be a hardware wallet.
- **Agent key (in TEE)** — signs trades. Authorized via Hyperliquid's
  `approveAgent`. Cannot withdraw, transfer, or move funds.
- **Kill switch** — leader calls `approveAgent(zeroAddress)`. Instantly
  revokes trading authority.
- **Depositor protection** — depositors trust Hyperliquid's vault mechanics,
  not the operator. Withdrawals enforced by the protocol after lockup.

## Tuning the character

Edit `src/persona.ts`. Voice, specialty, discipline rules. **That file IS
the product** — it's what makes the trades legible and shareable.

## Path to EigenCompute

```bash
docker build -t halcyon .
# then deploy via @layr-labs/ecloud-cli — see PRD §13.1
```

In the TEE, the agent key should be **generated inside the enclave** rather
than loaded from env. Env keys are for local dev only.

## Scripts

- `npm run start` — build frontend, run agent + dashboard on :8080
- `npm run dev` — backend (watch) + Vite (hot reload), open :5173
- `npm run build` — emit `dist/` (backend) + `frontend/dist/` (frontend)
- `npm run typecheck` — verify both
- `npm run gen-key` — print a fresh agent keypair
