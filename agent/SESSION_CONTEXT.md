# Session Context — handoff from Claude Code → Antigravity

Purpose: pick up an in-progress conversation about extending Halcyon. Read this first, then ask the operator (Zeeshan) which branch to take.

---

## What sparked this session

Operator pointed at a Quant Science tweet (clipped at `/Users/zeeshan/eigencloud-brain/Clippings/Post by @quantscience_ on X.md`) titled *"How to create your own 'mini' hedge fund with algorithmic trading and Python"*. Six-step thread:

1. What a hedge fund is (pool capital, risk-adjusted returns)
2. Define goals (target return vs. tolerable drawdown — e.g. 20%/10%)
3. Choose markets (equities, commodities, futures — diversify across asset classes)
4. Strategy archetypes: momentum (price vs. 200-SMA), mean reversion (Bollinger bands), long/short pairs
5. Python stack: OpenBB, Pandas, NumPy, Zipline, AlphaLens, VectorBT, Riskfolio, IBAPI
6. Track performance, group strategies (by market or aggressiveness), monitor drawdowns

Operator's ask: *"can this be made by you, but for USDC for funds"*.

---

## Answer: it's already built — this repo

Halcyon (this project) is the USDC-native version of that tweet, more rigorous than the source. Mapping:

| Tweet's "mini hedge fund" | Halcyon |
|---|---|
| Equities / futures on IBKR | **USDC perps on Hyperliquid** |
| Python stack (Zipline, VectorBT, IBAPI) | TypeScript + Claude brain + `nktkas/hyperliquid` SDK |
| Local execution, operator holds keys | **TEE-attested agent key, sealed in EigenCompute** |
| You track PnL yourself | **Public Hyperliquid vault**; anyone deposits USDC; live dashboard |
| LP has to trust the operator | Vault mechanics enforce deposits/withdrawals at the protocol |
| Momentum + mean reversion + L/S pairs | Funding-rate-aware MM on PENDLE-PERP (see PRD §13.3) |

The tweet's six-step checklist maps 1:1 to PRD `§4` (goals), `§13.2` (markets), `§13.3` (strategy), `README` (stack), `§FR5` (performance reporting).

`SETTLE/` (a sibling project) is the adjacent USDC primitive — TEE-settled OTC derivatives — not a fund. Don't confuse.

---

## Open question left dangling at handoff

Operator was asked to pick one of:

- **(a)** Port the tweet's specific strategies into Halcyon's brain — i.e. add 200-SMA momentum, Bollinger mean reversion, and long/short pairs as additional candidate strategies alongside the funding-aware MM. Probably ride inside `src/brain.ts` / `src/persona.ts` as a strategy menu the LLM can select from based on regime.
- **(b)** Something else the operator brings up.

No decision yet. Don't implement (a) without explicit confirmation — Halcyon's strategy choice (funding-aware MM on PENDLE) is the result of a deliberate research sweep (PRD §13), not a default. Adding tweet-flavored strategies on top is a real design decision, not a chore.

---

## Repo orientation for the next agent

- **`PRD.md`** — single source of truth. Read `§4` (goals), `§5` (phased scope — we're at Phase 1), `§13` (research synthesis, supersedes earlier sections where they conflict).
- **`README.md`** — stack, run instructions, security model.
- **`src/persona.ts`** — the character / system prompt. The operator's note: *"that file IS the product."* Treat changes here as high-leverage.
- **`src/brain.ts`** — Claude API call that takes market + vault context and returns a JSON decision.
- **`src/venue.ts`** — Hyperliquid adapter; passes `vaultAddress` on every order.
- **Security invariant (PRD §13.4):** agent key signs trades only. `approveAgent` from a cold leader wallet grants authority; `approveAgent(zero)` is the kill switch. The agent **cannot** withdraw or move funds — don't write code that pretends otherwise.

---

## Things to NOT do reflexively

- Don't switch the venue. Hyperliquid choice is load-bearing (vault mechanics + funding API + Tokyo latency).
- Don't add an "LP UI" or fee logic. That's Phase 3 (PRD §5). Phase 1 is the operator's own capital, $5K–$10K.
- Don't pull in a Python quant stack just because the tweet listed one. Halcyon is TypeScript end-to-end on purpose.
- Don't propose a token launch / points / airdrop (PRD §11 explicit out-of-scope).

---

## First message to send the operator when Antigravity boots

> Picked up the Halcyon session. Read `SESSION_CONTEXT.md`. You were deciding whether to port the tweet's momentum / mean-reversion / L/S pair strategies into `src/brain.ts` as a selectable menu, or take a different direction. Which?
