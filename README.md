# Halcyon HQ — Discord leadership channel

A Discord bot that turns one channel into your fictional Halcyon leadership team.
Nine personas (CFO, Head of Data, Chief of Staff, Brand, Legal, Product, Knowledge, LP Relations, Capital Partnerships) post via webhooks, each with their own name + avatar. You message the channel; the router picks 1–3 to chime in. @-mention to address someone directly.

Persistent — everything lives in Discord history + `logs/messages.jsonl`. Survives laptop closes.

---

## Setup — Discord side (~5 min)

1. **Create a server** (or use an existing one). Discord app → `+` → "Create My Own".
2. **Create a text channel** named `#halcyon-leadership`.
3. **Get the channel ID.** In Discord settings → Advanced → enable Developer Mode. Right-click the channel → "Copy Channel ID". Save it.
4. **Create 9 webhooks on that channel.** Channel settings → Integrations → Webhooks → "New Webhook" — 9 times, one per persona. Name each one anything (the bot overrides the display name per post). Copy each webhook URL. You'll paste these into `.env` below.
5. **Create a bot application.** Go to <https://discord.com/developers/applications> → "New Application" → name it "Halcyon HQ". Left sidebar → "Bot" → "Reset Token" → copy the token.
6. **Enable Message Content Intent.** Same Bot page → scroll down → toggle "MESSAGE CONTENT INTENT" ON. Save.
7. **Invite the bot to your server.** Left sidebar → "OAuth2" → "URL Generator" → scopes: `bot`. Bot permissions: `Read Messages/View Channels`, `Read Message History`. Copy the generated URL, open it, pick your server, authorize.

That's the Discord side done.

---

## Setup — local

```bash
git clone https://github.com/zeeshan8281/halcyon.git halcyon-hq
cd halcyon-hq
cp .env.example .env
# Fill in: OPENROUTER_API_KEY, DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID, all 9 WEBHOOK_*
npm install
npm run dev
```

You should see `[ready] logged in as Halcyon HQ#XXXX` in your terminal.

Type something in `#halcyon-leadership`. Within a few seconds, 1–3 personas reply.

---

## Usage

- **Talk to the room.** Plain message → router picks who chimes in.
- **Talk to one person.** Include `@maya` or `@maya chen` anywhere in the message (no Discord ping needed — it's a text match).
- **Multi-mention.** `@theo @sam` will trigger both, in order.
- **History.** All messages saved to `logs/messages.jsonl`. On restart, the last 30 are reloaded into context so the conversation feels continuous.

### `CHIME_IN` toggle

In `.env`:
- `CHIME_IN=true` (default) — personas chime in on plain messages.
- `CHIME_IN=false` — silent unless @-mentioned.

---

## The cast

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
| @diego | Diego Park | Head of Capital Partnerships |

Each persona's voice + domain is defined in `src/personas.ts`. Edit there to tune.

---

## Cost notes

- One CEO message → 1 router call (Haiku, ~$0.001) + 1–3 persona calls (Sonnet, ~$0.01 each).
- Typical turn: **≈$0.01–0.04**.
- Hosting: free (runs on your laptop). To keep it always-on, host on Railway/Render (~$5/mo).

---

## Files

```
src/
  index.ts         entry — loads .env, starts orchestrator
  orchestrator.ts  Discord client + message routing + webhook posting
  router.ts        cheap Claude call: who should chime in?
  personas.ts      9 character definitions + system prompts
  claude.ts        OpenRouter (OpenAI SDK) wrapper — talks to Claude
  log.ts           JSONL persistence + load-on-boot
logs/
  messages.jsonl   the channel transcript (gitignored)
```
