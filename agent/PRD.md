# PRD — Agentic Micro Hedge Fund on EigenCompute

**Status:** Draft v0.1
**Owner:** Zeeshan
**Last updated:** 2026-04-20

---

## 1. Overview

A single-operator hedge fund product where each "fund" is an autonomous agent running inside an EigenCompute TEE. The agent holds its own wallet keys inside the enclave, executes a defined trading strategy against on-chain venues, and produces cryptographically attested PnL. Each agent targets a single thin-liquidity market or strategy archetype. A strategist (the operator) eventually runs a fleet of these; LPs subscribe to individual agents or to a meta-vault that allocates across the fleet.

**The thesis in one sentence:** there is structural alpha in markets that are too small for traditional funds to deploy into and too unattractive for solo on-chain bots to specialize in, and an agent-in-an-enclave is the right operational form factor to harvest it at scale.

---

## 2. Problem & opportunity

### What's broken
- Traditional hedge funds have a minimum-viable-AUM floor (operational overhead, LP minimums, regulatory cost). Below ~$100M AUM, the unit economics don't work for an institutional vehicle.
- That floor means markets with capacity below ~$10M of deployable size are structurally ignored by the fund universe.
- On-chain prop bots compete in *some* of that space, but they cluster on the obvious trades (top-pair funding arb, CEX/DEX basis on majors). Bot operators have no incentive to specialize in a 40th market because it doesn't move the needle for a solo trader.
- LPs who want exposure to crypto microstructure alpha have no clean way to access it. They get either (a) megafunds that don't touch the long tail, or (b) anon Twitter quants who can't accept outside capital safely.

### What changes if this works
- A two-person shop can operate a fund with the per-strategy capacity discipline of a much larger one, because the marginal cost of an additional agent is near-zero infra.
- Strategies become inspectable, attested artifacts. LPs subscribe to a verified image, not a person's promise.
- The unextractable wallet (key in enclave) eliminates the most common cause of crypto fund death: operator key compromise.

### Why now
- EigenCompute makes TEE deployment with on-chain attestation operationally simple.
- Hyperliquid and similar on-chain perp venues have maturing API surface area, real depth on top markets, and a long tail with real spread.
- LLM-assisted strategy development has lowered the cost of building per-market specialist agents from "a quant team for a year" to "a strategist for a few weeks."

---

## 3. Target users

### Primary: the strategist (operator) — initially just Zeeshan
Builds, deploys, and supervises agents. Owns the strategy IP. Needs:
- Fast iteration from local backtest → testnet → live mainnet
- Visibility into agent state and PnL
- Confidence the agent can't be tampered with post-deploy
- A way to kill or retire an agent cleanly

### Secondary (Phase 3+): the LP
Subscribes capital to one or more agents. Needs:
- Verifiable claims about what the agent does (image attestation)
- Verifiable PnL (signed performance feed)
- Predictable deposit/withdraw mechanics (vault contract)
- Risk transparency (current exposure, drawdown, position concentration)

### Out of scope as a user
The end-retail buyer of tokenized fund exposure. We're not building a Robinhood. LPs are sophisticated, KYC'd, and capital is in size.

---

## 4. Goals & non-goals

### Goals
- **G1.** Deploy a single agent to EigenCompute that holds its own key, executes a defined strategy on a single venue, and runs unattended for 30+ days.
- **G2.** Generate a continuous, signed PnL stream that an external party could verify against on-chain trade history.
- **G3.** Prove enclave-resident keys: demonstrate that the operator (Zeeshan) cannot extract the private key, even with full machine access.
- **G4.** Establish unit economics: infra cost per agent per month, time cost per new agent, breakeven AUM per agent.
- **G5.** Validate strategy edge with real money before adding fleet, LP, or meta-vault complexity.

### Non-goals (Phase 1)
- Accepting outside capital (no LPs, no vault contract, no fee accrual logic)
- Running more than one agent in parallel
- Cross-venue execution
- Strategy auto-discovery by the agent
- A UI beyond a CLI / log viewer
- Marketing site, branding, public comms

---

## 5. Phased scope

### Phase 0 — Foundation (week 1–2)
- Local strategy harness: backtest infrastructure, paper-trade against live venue
- Venue adapter for Hyperliquid (order placement, position queries, funding queries, market data)
- One strategy implemented and backtested over 6+ months of historical data
- Decision: which strategy archetype, which market, what capacity ceiling

### Phase 1 — TEE MVP (week 3–6)
- Agent containerized and deployed to EigenCompute
- Key generated and held inside enclave; never exposed
- Live trading on mainnet with operator's own capital ($5K–$25K)
- Continuous PnL logging with cryptographic signature from enclave
- Kill switch: operator can halt new orders but cannot extract keys
- 30-day live run with daily PnL review

### Phase 2 — Operational hardening (week 7–10)
- Monitoring/alerting (drawdown, position size, latency, venue errors)
- Strategy parameter tuning workflow (backtest → testnet → mainnet promotion)
- Disaster recovery: what happens if EigenCompute node dies, venue goes down, network partitions
- Second agent on different market/strategy to test multi-agent operations

### Phase 3 — LP-readiness (month 4+, only if Phases 0–2 prove edge)
- Vault contract for deposits/withdrawals
- Fee accrual (management + performance)
- Public attestation feed (image hash + signed PnL on-chain or via reputable oracle)
- Legal wrapper decision: jurisdictional structure, KYC vendor, LP onboarding flow
- First external LP capital (friends-and-family round)

### Phase 4 — Fleet (month 6+)
- Meta-vault contract
- Cross-agent allocation logic
- Strategist toolkit for spinning up new specialist agents quickly
- Scout layer: what's the workflow for finding the next market

---

## 6. Functional requirements (Phase 1 MVP)

### FR1 — Agent runtime
- Runs as a single container image inside an EigenCompute enclave
- Image is reproducible (deterministic build), hash is published before deploy
- Reads strategy config from an enclave-readable, operator-signed config blob
- Enters main loop: poll market data → evaluate strategy → place/cancel orders → log state

### FR2 — Key management
- Wallet private key generated *inside* the enclave on first boot
- Key is sealed to the image hash + enclave identity (cannot be migrated to a different image)
- Public key / address is exported for funding
- No code path exists that can export the private key to operator, host, or network

### FR3 — Strategy execution
- One strategy, one market, deterministic logic
- Strategy parameters loaded from signed config; agent rejects unsigned configs
- All decisions logged with inputs (market state) and outputs (orders)
- Position size capped by hard-coded max-exposure parameter

### FR4 — Venue interaction (Hyperliquid)
- Sign and submit orders using enclave-resident key
- Query positions, balances, fills, funding
- Handle venue errors (rate limit, rejection, partial fill) without crashing
- Reconnect on disconnect; resume state from venue-side truth, not local cache

### FR5 — PnL & state reporting
- Compute realized + unrealized PnL on every cycle
- Sign each PnL snapshot with enclave key
- Stream to operator-controlled log sink (S3, IPFS, or simple HTTPS endpoint)
- Snapshot includes: timestamp, position, mark, realized, unrealized, image hash, signature

### FR6 — Operator controls
- Kill switch: operator-signed message that puts agent in flatten-and-halt mode
  - Agent closes positions, cancels open orders, stops trading
  - Cannot be used to extract funds — only to wind down to cash, which can then be withdrawn to a pre-committed operator address
- Withdraw address is set at deploy time, baked into image, cannot be changed post-deploy

### FR7 — Image upgrade path
- New image = new agent identity = new key = new wallet
- No "live upgrade" — the only way to change strategy is to spin up a fresh agent and migrate capital manually
- This is a feature, not a bug: it makes attestation meaningful

---

## 7. System architecture (Phase 1)

```
┌─────────────────────────────────────────────────────────────┐
│                    EigenCompute TEE                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Agent container (image hash: sha256:...)              │ │
│  │                                                        │ │
│  │   ┌──────────┐  ┌────────────┐  ┌──────────────────┐  │ │
│  │   │ Strategy │→ │ Risk gate  │→ │ Hyperliquid SDK  │  │ │
│  │   └──────────┘  └────────────┘  └─────────┬────────┘  │ │
│  │        ↑              ↑                    │           │ │
│  │   ┌──────────┐  ┌────────────┐             │           │ │
│  │   │ Market   │  │ Sealed key │─────────────┘           │ │
│  │   │ data     │  │ (in-enclave)                         │ │
│  │   └──────────┘  └────────────┘                         │ │
│  │                                                        │ │
│  │   ┌─────────────────────────────────────────────────┐  │ │
│  │   │ Signed PnL emitter ──────► external log sink   │  │ │
│  │   └─────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕
              ┌─────────────────────────┐
              │  Hyperliquid (mainnet)  │
              └─────────────────────────┘

         Operator (outside enclave) can:
         - View signed logs
         - Send signed kill-switch message
         - Cannot extract key, cannot modify image, cannot redirect funds
```

### Components
- **Agent container:** Python or Rust, single binary preferred. Strategy + risk + venue client + key manager + signer.
- **Sealed key store:** Generated in-enclave on first boot, sealed to image identity. Persists across container restarts within the same enclave.
- **Signed PnL emitter:** Periodic job that snapshots state, signs it, posts to external sink. Sink can be public — that's the point.
- **External log sink:** S3 bucket, IPFS pin, or HTTPS receiver. Operator-owned. Stores signed snapshots for later verification.
- **Operator CLI:** Local tool for deploy, kill-switch, log inspection. Does NOT have a code path that can extract keys.

### Build and deploy
- Reproducible build (Nix or Docker with pinned deps)
- Image hash published to operator's record before deploy
- EigenCompute deploys image; returns enclave attestation
- Operator funds the address shown by the attested agent
- Agent begins trading

---

## 8. Non-functional requirements

### NFR1 — Security
- Private key never leaves enclave under any operator-accessible code path
- Image hash is the unit of identity — different image = different agent
- Withdraw address is image-baked and cannot be modified by operator post-deploy
- Kill switch reduces position to zero but does not unilaterally move funds

### NFR2 — Determinism
- Same image + same inputs → same orders
- No `os.environ`, no wall-clock-derived randomness, no nondeterministic external calls in the strategy path
- All randomness (if any) seeded from chain data so it's reproducible from logs

### NFR3 — Latency
- Strategy cycle ≤ 1s end-to-end for MVP. Not competing with HFT — passive market-making with tilt does not require sub-100ms.
- Order submission ≤ 500ms p99 against Hyperliquid mainnet.

### NFR4 — Availability
- Single agent, single enclave for MVP. Not designing for HA in Phase 1.
- Agent should resume cleanly from any restart by reading position state from venue, not local cache.

### NFR5 — Cost
- Target: ≤ $200/month all-in infra per agent (EigenCompute + log sink + monitoring). At higher cost per agent, the long-tail thesis breaks.

### NFR6 — Auditability
- Every order has a corresponding log entry with strategy state at decision time
- Logs are append-only and signed
- An external party with the image hash and the log stream should be able to verify: "this image, given these market inputs, would produce these orders"

---

## 9. Success metrics

### Phase 1 exit criteria (must hit all to proceed to Phase 2)
- Agent runs unattended for 30+ days without operator intervention
- Zero unaccounted-for capital movements
- Sharpe ≥ 1.5 on the live run, after all costs (gas, funding, fees, slippage)
- Max drawdown ≤ 15% of starting capital
- Demonstrated kill-switch and clean wind-down without key exposure
- Total infra cost per month is in the target band

### Long-term (Phase 3+) success metrics
- Per-agent AUM × strategist count of agents ≥ $5M total deployed within 12 months
- LP-facing attested PnL has zero discrepancy with reconstructed-from-chain PnL
- Time from "new market identified" to "agent live" ≤ 2 weeks per new agent

---

## 10. Risks & open questions

### Strategic
- **R1 (open):** What strategy archetype for v0? Leading candidate: passive market-making with directional tilt on a Hyperliquid mid-tail perp. Alternative: funding arb, spot/perp basis. Decision needed before Phase 0 backtests.
- **R2 (open):** Which specific market for v0? Needs analysis: spread, depth, funding volatility, volume, who else is making markets.
- **R3:** Thin-market execution cost may exceed gross edge. Mitigation: design strategy as maker (earn spread) rather than taker (pay spread). Validate in Phase 0 backtests.
- **R4:** On-chain transparency means strategy reverse-engineering by competitors. Mitigation: don't worry about it pre-revenue; if it becomes a problem post-revenue, rotate wallets and obfuscate sizing.

### Technical
- **R5:** Sealed key durability across EigenCompute node migrations. Open question: what happens if the enclave is moved to a different physical host? Need to verify with EigenCompute docs.
- **R6:** Hyperliquid API stability and rate limits at our usage pattern. Test in Phase 0.
- **R7:** Reproducible builds inside an enclave with venue SDKs that have non-deterministic deps. May force us to vendor & pin aggressively.

### Legal / business
- **R8 (defer to Phase 3):** LP vault is a security in most jurisdictions. Will need legal opinion before taking outside capital. Likely shape: offshore vehicle (Cayman/BVI), Reg D / Reg S for any US-touching investors, KYC on all LPs.
- **R9 (defer to Phase 3):** Mark-to-market in illiquid markets is fictional. PnL "as of close" is not the same as PnL "if I unwound now." Need a reporting convention before LP capital.

### Operator
- **R10:** This is a research-heavy job. Phase 4 fleet model assumes the strategist can find new markets at a rate of one every 1–2 weeks. Unproven.
- **R11:** Single-operator key person risk. The strategist's death/incapacity is currently unmitigated.

---

## 11. Out of scope (explicit, to prevent scope creep)

- Token launch, governance token, points program, airdrop
- Multi-chain support (start on a single L1/L2 only)
- A web UI for LPs
- Mobile app
- "AI agent that discovers strategies" — the agent executes, the strategist designs
- Cross-margining or portfolio optimization across agents (Phase 4 if at all)
- Brokerage relationships, off-chain assets, traditional commodities (until tokenized RWA matures, which is not on the critical path)

---

## 12. Decisions needed from operator before Phase 0 starts

> **Status:** Resolved via research sweep on 2026-04-20. See section 13 for evidence and reasoning. Items below show recommendation; operator confirms or overrides.

1. **Strategy archetype** → **Funding-rate-aware MM** (passive 2-sided quoting with skew driven by funding regime). [Confirm]
2. **Target market** → **PENDLE-PERP on Hyperliquid** as v0; JTO-PERP as backup if PENDLE conditions deteriorate. [Confirm]
3. **Implementation language** → **Rust**, using `infinitefield/hypersdk`. [Confirm]
4. **Starting capital for Phase 1 live run** → **$5K–$10K** (constrained by EigenCompute alpha state, see §13.1). [Operator decides]
5. **Kill-switch / withdraw address** → cold wallet operator controls; agent never holds withdraw rights (see §13.4 agent-key pattern). [Operator provides]

---

## 13. Research synthesis — 2026-04-20

Five parallel research agents resolved the open questions. Key findings below; full reports archived separately. This section supersedes the relevant parts of §6, §7, §10, §12 where it conflicts.

### 13.1 EigenCompute is in mainnet alpha — this changes Phase 1 scope

- Launched **2025-09-30**. Single KMS node operated by EigenLabs. EigenLabs themselves explicitly recommend against production-class workloads.
- TEE backend: choose **Intel TDX** (`g1-standard-4t` or `-8t`). Other options (Shielded VM, SEV-SNP) either lack attestation or are weaker.
- Key sealing: keys are **KMS-encrypted, bound to image digest**. Survive container restart and node migration. **Do NOT survive KMS loss** — single-node KMS is the systemic risk.
- Attestation is real and verifiable: Verifiability Dashboard at `verify-sepolia.eigencloud.xyz` (testnet) and `verify.eigencloud.xyz` (mainnet). Image hash whitelist is on-chain.
- Deployment via `@layr-labs/ecloud-cli`. `linux/amd64` only. Outbound HTTPS/WSS works. Persistent disk is **not** first-class — treat container as ephemeral.
- **Pricing is not public** — must contact EigenLabs to model unit economics. NFR5 ($200/mo target) is currently a guess.
- Implication: cap Phase 1 live capital at **$5K–$10K** until KMS decentralizes or we have an off-platform key-recovery story.

### 13.2 Hyperliquid market selection — PENDLE > JTO > PURR for v0

Mid-tail zone (rank 31–80 by 24h volume) is the structural opportunity:
- HLP dominates quoting; pro MMs (Wintermute, Flowdesk) ignore this band.
- Spreads 5–25 bps vs. <1 bps on top markets.

Top three v0 candidates:

| Market | 24h Vol | Spread | Funding | Why |
|---|---|---|---|---|
| **PENDLE** | $8–20M | 4–10 bps | Stable, mildly +ve | Mature DeFi token, low gap risk, shallow enough to participate but deep enough to scale |
| **JTO** | $6–15M | 5–12 bps | Stable | SOL-beta, slightly more directional energy |
| **PURR** | $8–20M | 4–10 bps | Mildly persistent +ve | HL-native, retail flow, but thin book → fat-tail risk |

**Avoid for v0**: BTC/ETH/SOL (no edge), HYPE (toxic flow / informed insider participation), FARTCOIN/MOODENG/GOAT (memecoin gap risk), anything rank 80+, anything listed in last 2 weeks.

### 13.3 Strategy: funding-rate-aware MM, not pure Avellaneda-Stoikov

Reasoning:
- TEE adds 50–500ms attestation/network overhead. Pure microstructure MM degrades under this latency. Funding signals operate on hour timescales — TEE penalty is rounding error.
- Funding edge scales proportionally with capital — works at $10K, works at $10M. Pure spread capture has fixed costs that dominate at small size.
- Worst case is bounded: wrong-sided in funding flip, capped by inventory limit. Unlike basis arb (leg risk = blowup) or cascade taker (idle 95% of time).
- Build path: AS reservation price + Hyperliquid funding API poll + 3-state regime classifier (positive / neutral / negative funding past threshold) + asymmetric inventory caps + skew quotes against the regime. ~1500 LOC Rust.

**Honest reframing (per competitive landscape research):** at $5–25K, you are not "competing with Wintermute." You are a **fee/funding harvester with strict inventory limits**. Realistic Sharpe is 1–2 net of costs, not 3+. Dominant failure mode is one bad fill on a thin alt that gaps 30%+. Survival depends on inventory discipline, not signal quality.

### 13.4 Architectural change: agent-key approval pattern (CRITICAL — supersedes §FR2)

Hyperliquid supports an "API wallet" / agent-key model that should be the canonical pattern for TEE-resident bots:

1. **Cold master wallet** (operator-controlled, hardware wallet, OFFLINE) holds the actual capital.
2. **Agent key** is generated *inside the TEE*, sealed to image digest. Only the TEE can sign with it.
3. From the cold master, operator does a **one-time on-chain `approveAgent` transaction** authorizing the agent key to place/cancel/modify orders on the master's account.
4. The agent key inside the TEE can sign **trading actions only**. It **cannot** withdraw, transfer, or move funds — those require the master key.

Implications:
- Withdraw address is no longer baked into image (FR6 needs revision). Withdraw is an off-platform operator action against the cold master.
- "Kill switch" is just `approveAgent(zero)` from the cold master — instantly revokes the agent's trading authority. No need for an in-enclave kill switch.
- TEE compromise scenario is **bounded to "agent can lose ≤ inventory limit by trading badly"**. Cannot be drained.
- Eliminates the worst risk class entirely. This is the single most important architectural decision in the doc.

### 13.5 SDK and venue specifics

- **Use `infinitefield/hypersdk` (Rust).** More active than the official Rust SDK, complete EIP-712 phantom-agent signing, raw-key signer, batch + tick-rounding primitives, HyperEVM helpers.
- Signing is pure ECDSA secp256k1 — TEE-friendly, no wallet integration needed.
- Subscribe to `userFills`, `userEvents`, `orderUpdates` over WS. Do **not** poll fills.
- Use `cloid` (client order ID) for idempotent retries across reconnect.
- Run `scheduleCancel` (dead-man's switch) so orders auto-cancel if agent goes silent.
- Hyperliquid validators in AWS `ap-northeast-1` (Tokyo). Co-locate the EigenCompute deployment in Tokyo if possible — 200ms RTT advantage matters even for hour-scale strategies if you're racing other MMs to be at top of book. **Open question: can EigenCompute deploy to Tokyo region on GCP?** [needs answer]
- Rate limits: 1200 weight/min per IP, 1 request per 1 USDC of cumulative volume per address (10K buffer). Funding-aware MM is well below either.

### 13.6 Open questions still unresolved

- **EigenCompute pricing** — must contact EigenLabs.
- **EigenCompute region selection** — can we deploy to GCP `asia-northeast1` for HL co-location?
- **KMS disaster recovery** — what is EigenLabs' documented procedure if KMS node fails?
- **Live spread/depth re-verification on PENDLE** — the research used Q1 2026 figures. Re-pull from Hyperliquid `info` API before any backtest.

### 13.7 Risk register updates

- **R1, R2:** RESOLVED (see 13.2, 13.3).
- **R5:** REFINED. Original concern was sealed key durability. Real risk is **single-KMS-node systemic risk** during EigenCompute alpha. Mitigation: cap capital, don't take LP funds until GA.
- **NEW R12:** Hyperliquid co-location asymmetry. Tokyo-resident MMs have 200ms latency edge. Mitigates if EigenCompute supports Tokyo region; otherwise we accept worse fills.
- **NEW R13:** Agent-key approval pattern (§13.4) means we are dependent on Hyperliquid's `approveAgent` mechanism not being changed in a breaking way. Low probability, monitor.
