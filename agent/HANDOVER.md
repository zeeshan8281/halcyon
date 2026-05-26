# Halcyon — Company Handover

**Last updated:** 2026-05-24
**Operator:** Zeeshan (`zeeshan8281@gmail.com`)
**Repo:** `/Users/zeeshan/agentic-micro-hedge` (product name: **Halcyon**)

This is the **company-level** handover doc. For engineering session continuity, also read `SESSION_CONTEXT.md`. For full product spec, read `PRD.md`. For run instructions, read `README.md`.

---

## 1. What Halcyon is

An **agentic micro hedge fund**: an LLM-driven trading agent running inside an EigenCompute TEE, trading USDC perps on Hyperliquid against a **public Hyperliquid vault**. Anyone in the world can deposit USDC. The agent's wallet is sealed inside the enclave — even the operator cannot drain it. Vault mechanics enforce deposits/withdrawals at the protocol level. Attested execution + public wallet + named character + public Twitter narration is the brand.

**One-sentence thesis:** structural alpha exists in markets too small for traditional funds and too unattractive for solo on-chain bots; an agent-in-an-enclave is the right form factor to harvest it at scale.

**The product** is three things at once:
1. A **fund** (vault + agent + on-chain PnL).
2. A **character** (`src/persona.ts` — voice, specialty, discipline rules; *this file IS the product*).
3. A **proof** (TEE attestation that the human cannot touch the keys).

---

## 2. Strategic posture — read this before suggesting anything

**Virality > Sharpe.** The operator has decided this explicitly. Reference points: TruthTerminal, AI16Z, Claude-runs-vending-machine, Goose-plays-Pokémon. Pattern: named character + real wallet + autonomous + public stakes + TEE-verifiable.

- Don't recommend pure deterministic strategies as v0 — "the agent IS the trader" is non-negotiable.
- Treat character / persona / public surface (Twitter/Farcaster, attestation page, public wallet) as a **first-class product surface**, not marketing afterthought.
- Surface the TEE/EigenCompute angle as **brand differentiation** ("here's proof the human can't touch the keys"), not just security.
- When trading off "viral" vs "rigorous," lean viral.

**Honest reframing:** at $5–25K, Halcyon is not "competing with Wintermute." It's a fee/funding harvester with strict inventory limits. Realistic Sharpe is 1–2 net of costs. Dominant failure mode = one bad fill on a thin alt that gaps 30%+. Survival = inventory discipline, not signal quality.

---

## 3. Current state (Phase 1)

- **Phase:** 1 per PRD §5 — operator's own capital ($5K–$10K), real trading, no LPs yet.
- **Capital cap rationale:** EigenCompute is mainnet *alpha* (launched 2025-09-30), single KMS node, EigenLabs themselves recommend against production workloads. Cap until KMS decentralizes.
- **v0 market:** PENDLE-PERP on Hyperliquid. Backup: JTO-PERP. Avoid: BTC/ETH/SOL (no edge), HYPE (toxic flow), memecoins (gap risk), rank 80+, anything listed in last 2 weeks.
- **v0 strategy:** funding-rate-aware market-making (2-sided quoting, skew driven by funding regime). TEE adds 50–500ms latency — funding signals operate on hour timescales, so latency is rounding error. (Note: this was the Phase 0 quant decision. The **viral pivot** moved Halcyon to LLM-as-trader: Claude calls in `src/brain.ts` produce JSON decisions per cycle. The funding-aware MM logic is now context Claude reasons over, not a hardcoded algo.)
- **What's built:** backend (`src/`), frontend dashboard (`frontend/`), Hyperliquid venue adapter, Claude brain, Twitter poster, persona prompt, vault-aware order flow, multi-stage Dockerfile for TDX.
- **What's not yet:** EigenCompute deployment (still local). 30-day unattended live run. Public attestation feed. Vault open to outside depositors.

**Live engineering decision dangling (from prior session, see `SESSION_CONTEXT.md`):** whether to port the Quant Science tweet's momentum / mean-reversion / L/S pair strategies into `brain.ts` as a selectable strategy menu. Not decided. Don't implement without operator confirmation.

---

## 4. Stack

**Language:** TypeScript end-to-end (Node 22, ESM). The Phase 0 decision to use Rust + `infinitefield/hypersdk` was **superseded by the viral pivot** — TS gives faster iteration on the persona and dashboard, which are the viral surface.

**Backend** — `@anthropic-ai/sdk` (Claude), `hyperliquid` (`nktkas` SDK, vault-aware), `viem` (keypair), `twitter-api-v2`, `dotenv`. HTTP via built-in `node:http`. Storage = JSONL files (no DB).

**Frontend** — Vite + React 18 + TypeScript + Tailwind. Dark-terminal theme. Polls `/api/state` every 3s.

**Container** — Multi-stage `linux/amd64`, single Node 22 slim image, drop-in for EigenCompute TDX (`g1-standard-4t` or `-8t`).

**Repo layout:**
```
src/
  index.ts        main loop: read market → decide → trade → post → sleep
  config.ts       env + symbol normalization (-PERP suffix)
  venue.ts        HyperliquidVenue — passes vaultAddress on every order
  brain.ts        Claude API call: vault+market context → JSON decision
  poster.ts       Twitter post (or dry-run log)
  persona.ts      system prompt — the character (THE PRODUCT)
  log.ts          append-only JSONL event log
  server.ts       serves frontend/dist + GET /api/state
  types.ts        shared backend types
frontend/         React + Vite + TS + Tailwind dashboard
  src/components/ Header, VaultBar, AccountPanel, PositionsTable,
                  MarketTable, DecisionsFeed, TweetsFeed,
                  DepositorsTable, TradesFeed
bin/gen-key.mjs   fresh agent keypair (npm run gen-key)
Dockerfile        multi-stage linux/amd64 image
PRD.md            single source of truth — read §4, §5, §13
README.md         setup + run + scripts
SESSION_CONTEXT.md engineering session handoff
HANDOVER.md       this file
```

---

## 5. Setup & run

**Need:** Anthropic API key, Hyperliquid leader wallet funded with USDC (testnet has faucet).

```bash
npm install
npm --prefix frontend install

# 1. Create a vault at https://app.hyperliquid-testnet.xyz/vaults — save address
# 2. Generate agent keypair
npm run gen-key
# 3. Authorize the agent at https://app.hyperliquid-testnet.xyz/API from leader wallet
# 4. cp .env.example .env  and fill:
#    ANTHROPIC_API_KEY, HL_NETWORK=testnet, HL_AGENT_PRIVATE_KEY,
#    HL_LEADER_ADDRESS, HL_VAULT_ADDRESS
```

**Run:**
- `npm run start` — build frontend, agent + dashboard on `:8080`
- `npm run dev` — backend watch + Vite hot reload, open `:5173`
- `npm run typecheck` — verify both
- `npm run gen-key` — fresh agent keypair

**Deploy to EigenCompute (when ready):** `docker build -t halcyon .` then `@layr-labs/ecloud-cli`. In TEE, the agent key must be **generated inside the enclave**, not loaded from env. Env keys are local-dev only.

---

## 6. Security invariant — must not violate

- **Leader (cold)** — owns the vault, approved the agent. Should be a hardware wallet. Only the leader can move funds in/out.
- **Agent key (in TEE)** — generated *inside* the enclave on first boot, sealed to image digest. Signs **trading actions only**. Cannot withdraw, transfer, or move funds.
- **Authorization** — one-time on-chain `approveAgent` from cold leader grants trading authority on leader's account.
- **Kill switch** — leader calls `approveAgent(zeroAddress)`. Instantly revokes. No in-enclave kill switch needed.
- **TEE compromise blast radius** — bounded to "lose ≤ inventory limit by trading badly." Cannot be drained.
- **Depositor protection** — depositors trust Hyperliquid's vault mechanics, not the operator. Withdrawals enforced by protocol after lockup.
- **Image hash = identity.** New image = new agent = new key = new wallet. No live upgrade. This is a feature — makes attestation meaningful.
- **Withdraw address** is *not* image-baked (FR6 was superseded by the agent-key pattern in PRD §13.4). Withdraws are off-platform leader actions.

Don't write code that pretends the agent can move funds. Don't propose key-export "for convenience."

---

## 7. Out of scope — don't reflexively propose

- Token launch, governance token, points program, airdrop (PRD §11).
- LP UI / fee logic / external LP onboarding — that's Phase 3.
- Switching venue away from Hyperliquid (vault mechanics + funding API + Tokyo latency are load-bearing).
- Python quant stack (Zipline, VectorBT, IBAPI) — TS is intentional.
- Multi-chain, mobile app, "AI that discovers strategies."
- Adding cross-margining or portfolio optimization across agents (Phase 4 if at all).
- Pure deterministic strategies as v0 — those are for the Phase 4 fleet.

---

## 8. Phase 1 exit criteria (per PRD §9)

All must hit to proceed to Phase 2:
- Agent runs unattended 30+ days, zero operator intervention.
- Zero unaccounted-for capital movements.
- **Sharpe ≥ 1.5** on the live run, net of all costs.
- **Max drawdown ≤ 15%** of starting capital.
- Demonstrated kill-switch and clean wind-down without key exposure.
- Infra cost per month ≤ $200 target (currently a guess — EigenCompute pricing not public).

---

## 9. Open questions (still unresolved)

From PRD §13.6 + risk register:
1. **EigenCompute pricing** — must contact EigenLabs to model unit economics.
2. **EigenCompute region** — can we deploy to GCP `asia-northeast1` (Tokyo) for Hyperliquid co-location? 200ms RTT matters even at hour-scale strategies.
3. **KMS disaster recovery** — documented procedure if single-node KMS fails?
4. **Live PENDLE re-verification** — research used Q1 2026 figures. Re-pull from Hyperliquid `info` API before any backtest or live deploy.
5. **Engineering: tweet strategies in `brain.ts`?** — port momentum / mean-reversion / L/S pairs as a strategy menu, or stay focused on funding-aware MM? (See `SESSION_CONTEXT.md`.)

---

## 10. Tooling — Claude Code plugins installed (2026-05-24)

Marketplace `anthropics/knowledge-work-plugins` added at **user scope**. Nine plugins installed:

| Plugin | Use for | Slash command prefix |
|---|---|---|
| `finance` | Fund accounting, reconciliation against on-chain wallet activity, statements for future LPs | `/finance:*` |
| `data` | Querying market data, backtest SQL, perf analytics, on-chain analysis | `/data:*` |
| `productivity` | Personal task / calendar / workflow management across Slack/Notion/Linear | `/productivity:*` |
| `marketing` | **High leverage — viral content workflows**, brand voice, campaign briefs, competitor moves | `/marketing:*` |
| `legal` | Fund formation docs, NDAs, terms, vault disclaimers, compliance triage | `/legal:*` |
| `product-management` | Roadmap, specs, feature briefs, user research synthesis | `/product-management:*` |
| `enterprise-search` | Cross-surface search (Slack/Notion/Drive) as team grows | `/enterprise-search:*` |
| `sales` | LP outreach prep, prospect research, pipeline review when Phase 3 opens | `/sales:*` |
| `customer-support` | LP support, ticket triage, response drafting when vault opens to outside deposits | `/customer-support:*` |

**Plugins are generic out of the box.** Two customization steps unlock them:
1. Edit each plugin's `.mcp.json` to point at *your* tool stack (Slack workspace, Notion DB IDs, etc.). Until then connectors won't authenticate.
2. Drop Halcyon-specific context (fund name, agent character, strategy, EigenCompute architecture) into each plugin's `skills/` files so Claude speaks in Halcyon's voice.

**Highest-leverage to customize first:** `marketing` (viral is the strategy) and `legal` (vault opening to outside capital triggers real compliance work).

**Recipes:**
- List installed: `/plugin`
- Reinstall marketplace: `claude plugin marketplace add anthropics/knowledge-work-plugins`
- Install another: `claude plugin install <name>@knowledge-work-plugins`
- Bio-research and cowork-plugin-management are available but not installed (not needed yet).

**`eigen-skills`** skill is also available — use when deploying to EigenCompute.

---

## 11. Memory files (persist across Claude sessions)

Stored at `~/.claude/projects/-Users-zeeshan-agentic-micro-hedge/memory/`:

- `MEMORY.md` — index. Always loaded into Claude's context.
- `user_project.md` — what Halcyon is, thesis, open strategic questions.
- `project_decisions.md` — Phase 0 design decisions (note: language decision superseded by viral pivot).
- `feedback_viral_priority.md` — virality > Sharpe; character is the product.

**Memories are point-in-time snapshots, not live state.** Verify against the current repo before treating any memory as fact. If decisions change, update the memory file, don't just say it in chat.

---

## 12. First moves for the next session

In priority order:

1. **Customize `marketing` plugin first** — seed `marketing/skills/` with Halcyon's viral-LLM-trader brand voice (character, persona references like TruthTerminal/AI16Z, TEE-as-brand framing, transparency narrative). Use `src/persona.ts` as ground truth for voice.
2. **Then customize `legal`** — seed with vault disclaimers, Phase 3 LP wrapper questions (offshore vehicle, Reg D/S, KYC), and the security invariant from §6 of this doc.
3. Decide on the dangling engineering question (tweet strategies in `brain.ts`, see `SESSION_CONTEXT.md` §"Open question").
4. Open question chasers: contact EigenLabs for pricing + Tokyo region answers.
5. Re-pull live PENDLE spread/depth before any backtest or mainnet deploy.

**Don't start step 1 without the operator present** — voice is high-stakes and they want to be in the loop on character/persona choices.
