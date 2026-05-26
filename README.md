# Halcyon

Halcyon is an agentic micro hedge fund — an autonomous trading agent running on Hyperliquid, with a public dashboard, public wallet, and a fictional leadership team that talks in Discord.

This repo holds the whole project. Two pieces, deployed separately, one brand.

```
.
├── src/             ← HQ Discord bot — leadership chat (10 personas)
├── frontend/        ← (none here; lives under /agent)
├── agent/           ← Trading agent + terminal-style dashboard
│   ├── src/         ← Hyperliquid agent (TS, runs the strategy + posts the feed)
│   └── frontend/    ← React + Vite dashboard (the public-facing terminal UI)
└── README.md        ← you are here
```

| Piece | What it is | Deployed as |
|---|---|---|
| **HQ Discord bot** (root: `src/`, `package.json`) | A fictional leadership team — 10 personas (CFO, CoS, Brand, Legal, Product, Data, Knowledge, LP, Capital, Community) that respond in one Discord channel via webhooks. Internal-facing. | Railway service `halcyon-bot` |
| **Trading agent + dashboard** (`agent/`) | The actual trading loop on Hyperliquid + a terminal-style React dashboard at the public URL. The fund itself. | Railway service `halcyon-agent` |

---

## HQ Discord bot — quick start

Turns one Discord channel into your Halcyon leadership team. You message the channel; the router picks 1–3 personas to chime in. @-mention to address one directly.

### Setup — Discord side (~5 min)

1. Create a server (or use existing). Discord app → `+` → "Create My Own".
2. Create a text channel `#halcyon-leadership`.
3. Enable Developer Mode (Settings → Advanced) → right-click channel → "Copy Channel ID".
4. Create **10 webhooks** on that channel (Channel settings → Integrations → Webhooks). Copy each URL.
5. Create a bot at <https://discord.com/developers/applications> → "New Application" → "Bot" → "Reset Token".
6. Enable **Message Content Intent** on the Bot page.
7. OAuth2 → URL Generator → scopes: `bot`; perms: `Read Messages/View Channels`, `Read Message History`. Authorize into your server.

### Setup — local

```bash
git clone https://github.com/zeeshan8281/halcyon.git
cd halcyon
cp .env.example .env
# Fill in: OPENROUTER_API_KEY, DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID, all 10 WEBHOOK_*
npm install
npm run dev
```

`[ready] logged in as Halcyon HQ#XXXX` → type something in `#halcyon-leadership` → personas reply.

### Usage

- **Talk to the room.** Plain message → router picks who chimes in.
- **Talk to one.** `@maya` or `@maya chen` anywhere in the message.
- **Multi-mention.** `@theo @sam` triggers both.
- **History.** All saved to `logs/messages.jsonl`. Last 30 reloaded on restart.

`CHIME_IN=true` (default) — personas auto-chime. `CHIME_IN=false` — silent unless @-mentioned.

### The cast

| @ | Name | Role |
|---|---|---|
| @maya | Maya Chen | CFO |
| @priya | Priya Iyer | Head of Data |
| @jordan | Jordan Pak | Chief of Staff |
| @theo | Theo Marsh | Head of Brand & Marketing |
| @amara | Amara Okafor | General Counsel |
| @sam | Sam Reyes | Head of Product |
| @wren | Wren Halloway | Head of Knowledge |
| @lena | Lena Vasquez | Head of LP Relations |
| @nico | Nico Tran | Head of Community |
| @diego | Diego Park | Head of Capital Partnerships |

Voices + domains defined in `src/personas.ts`.

### Cost

- ~$0.001 router (Haiku) + ~$0.01 per persona reply (Sonnet) → **≈$0.01–0.04 per turn**.

---

## Trading agent + dashboard — quick start

Lives under [`agent/`](./agent). See [`agent/README.md`](./agent/README.md) for the full setup (Hyperliquid keys, vault binding, dashboard).

```bash
cd agent
cp .env.example .env
# Fill HL_PRIVATE_KEY, HL_VAULT_ADDRESS, etc.
npm install && npm run dev      # backend (the agent loop)
cd frontend && npm install && npm run dev   # dashboard
```

The dashboard talks to the agent's HTTP server and renders the public terminal UI — positions, vault, ticker, decisions feed, tweets, depositors.

---

## Deploys

Both pieces ship to Railway via the CLI (`railway up`) from their respective working directories:

- **`halcyon-bot`** — deployed from the root of this repo.
- **`halcyon-agent`** — deployed from `agent/`.

Secrets are managed per-service in Railway (`.env` files are gitignored).

---

## License

Source-available, no resale. Brand is reserved.
