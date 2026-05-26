import { Client, GatewayIntentBits, WebhookClient, type Message } from "discord.js";
import { activePersonas, matchMentions, type Persona } from "./personas.js";
import { callClaude, type ChatMsg } from "./claude.js";
import { routeMessage } from "./router.js";
import { appendLog, loadRecent, type TranscriptItem } from "./log.js";

const ACTIVE = activePersonas();
if (ACTIVE.length === 0) throw new Error("No personas have webhooks configured in .env");
console.log(`[boot] active personas: ${ACTIVE.map((p) => p.name).join(", ")}`);

const CHIME_IN = (process.env.CHIME_IN ?? "true").toLowerCase() === "true";
const MODEL_PERSONA = process.env.MODEL_PERSONA ?? "anthropic/claude-sonnet-4.5";
const MODEL_ROUTER = process.env.MODEL_ROUTER ?? "anthropic/claude-haiku-4.5";
const parseIds = (v: string | undefined) =>
  (v ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

// Internal/leadership channels (multi-persona routing). Accepts CSV list.
// Backward-compat: also reads singular DISCORD_CHANNEL_ID.
const LEADERSHIP_CHANNELS = new Set([
  ...parseIds(process.env.DISCORD_LEADERSHIP_CHANNEL_IDS),
  ...parseIds(process.env.DISCORD_CHANNEL_ID),
]);

// Community channels (only the community persona responds). Accepts CSV list.
// Backward-compat: also reads singular DISCORD_COMMUNITY_CHANNEL_ID.
const COMMUNITY_CHANNELS = new Set([
  ...parseIds(process.env.DISCORD_COMMUNITY_CHANNEL_IDS),
  ...parseIds(process.env.DISCORD_COMMUNITY_CHANNEL_ID),
]);

const COMMUNITY_PERSONA_ID = process.env.COMMUNITY_PERSONA_ID ?? "nico";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const HISTORY_LIMIT = 30;

if (!BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN missing in .env");
if (LEADERSHIP_CHANNELS.size === 0) {
  throw new Error("No leadership channels configured (DISCORD_LEADERSHIP_CHANNEL_IDS or DISCORD_CHANNEL_ID)");
}
console.log(
  `[boot] leadership channels: ${[...LEADERSHIP_CHANNELS].join(", ") || "(none)"}; community channels: ${[...COMMUNITY_CHANNELS].join(", ") || "(none)"}`,
);

// Per-persona webhooks (legacy / leadership): one webhook per persona, bound to
// the channel where the user created it. Posts always land there.
const personaWebhooks = new Map<string, WebhookClient>();
for (const p of ACTIVE) {
  const url = process.env[p.webhookEnv];
  if (url) personaWebhooks.set(p.id, new WebhookClient({ url }));
}

// Per-channel webhooks: one shared webhook per channel. All personas post via
// it, with their name + avatar overridden per-post. Env vars are
// CHANNEL_WEBHOOK_<channelId>=<url>.
const channelWebhooks = new Map<string, WebhookClient>();
for (const [key, val] of Object.entries(process.env)) {
  if (!key.startsWith("CHANNEL_WEBHOOK_") || !val) continue;
  const channelId = key.slice("CHANNEL_WEBHOOK_".length);
  channelWebhooks.set(channelId, new WebhookClient({ url: val }));
}
console.log(
  `[boot] persona webhooks: ${personaWebhooks.size}; channel webhooks: ${[...channelWebhooks.keys()].join(", ") || "(none)"}`,
);

const transcript: TranscriptItem[] = loadRecent(HISTORY_LIMIT);
console.log(`[boot] loaded ${transcript.length} prior messages`);

function record(item: TranscriptItem) {
  transcript.push(item);
  if (transcript.length > HISTORY_LIMIT * 2) transcript.splice(0, transcript.length - HISTORY_LIMIT);
  appendLog(item);
}

function buildMessagesFor(persona: Persona, channelId?: string): ChatMsg[] {
  // Render transcript as Claude alternating-role messages for THIS persona.
  // - Messages authored by this persona → assistant
  // - Everything else (CEO + other personas) → user, prefixed with "[Name (Role)]: ..."
  // Channel-scoped: only consider transcript items from the same channel. Legacy
  // entries without channelId fall through (they predate scoping).
  const scoped = channelId
    ? transcript.filter((it) => !it.channelId || it.channelId === channelId)
    : transcript;
  const raw: ChatMsg[] = scoped.map((item) => {
    if (item.authorId === persona.id) {
      return { role: "assistant" as const, content: item.content };
    }
    return {
      role: "user" as const,
      content: `[${item.authorName} (${item.role})]: ${item.content}`,
    };
  });

  // Merge consecutive same-role messages.
  const merged: ChatMsg[] = [];
  for (const m of raw) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) {
      last.content = `${last.content}\n${m.content}`;
    } else {
      merged.push({ ...m });
    }
  }

  // Claude requires first message to be user.
  if (merged.length === 0 || merged[0].role !== "user") {
    merged.unshift({ role: "user", content: "[Channel opened.]" });
  }

  return merged;
}

async function postAs(persona: Persona, content: string, channelId: string) {
  // Prefer the channel webhook (so the post lands in the channel the message
  // came from). Fall back to the persona's own webhook (legacy).
  const hook = channelWebhooks.get(channelId) ?? personaWebhooks.get(persona.id);
  if (!hook) {
    console.warn(
      `[skip] ${persona.name}: no webhook for channel ${channelId} and no persona fallback`,
    );
    return;
  }
  // Discord webhook content limit is 2000 chars.
  const truncated = content.length > 1900 ? content.slice(0, 1900) + "…" : content;
  await hook.send({
    content: truncated,
    username: `${persona.name} · ${persona.role}`,
    avatarURL: persona.avatarUrl,
  });
  record({
    ts: new Date().toISOString(),
    authorId: persona.id,
    authorName: persona.name,
    role: persona.role,
    content: truncated,
    channelId,
  });
}

async function runPersona(persona: Persona, channelId: string) {
  try {
    const messages = buildMessagesFor(persona, channelId);
    const reply = await callClaude({
      model: MODEL_PERSONA,
      system: persona.system,
      messages,
      maxTokens: 500,
    });
    if (!reply) return;
    await postAs(persona, reply, channelId);
  } catch (err) {
    console.error(`[${persona.id}] error:`, err);
  }
}

async function handleCeoMessage(text: string, channelId: string) {
  const isCommunity = COMMUNITY_CHANNELS.has(channelId);
  record({
    ts: new Date().toISOString(),
    authorId: "ceo",
    authorName: isCommunity ? "Community" : "Zeeshan",
    role: isCommunity ? "Visitor" : "CEO",
    content: text,
    channelId,
  });

  let speakers: Persona[];

  if (isCommunity) {
    // Community channel: only the community persona (Nico) responds.
    const nico = ACTIVE.find((p) => p.id === COMMUNITY_PERSONA_ID);
    if (!nico) {
      console.warn(`[community] persona "${COMMUNITY_PERSONA_ID}" not active — message ignored`);
      return;
    }
    speakers = [nico];
  } else {
    // Leadership channel: existing routing (mentions → router → all personas).
    speakers = matchMentions(text, ACTIVE);
    if (speakers.length === 0 && CHIME_IN) {
      const recent = buildMessagesFor({ id: "__none__" } as Persona, channelId).slice(-12);
      speakers = await routeMessage({ model: MODEL_ROUTER, recent, roster: ACTIVE });
    }
  }

  if (speakers.length === 0) return;

  console.log(`[route] channel=${channelId} -> ${speakers.map((s) => s.name).join(", ")}`);

  // Speak sequentially so later personas can see earlier ones.
  for (const p of speakers) {
    await runPersona(p, channelId);
    await new Promise((r) => setTimeout(r, 600));
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`[ready] logged in as ${client.user?.tag}`);
});

client.on("messageCreate", async (msg: Message) => {
  console.log(
    `[msg] channel=${msg.channelId} author=${msg.author.tag} bot=${msg.author.bot} webhook=${!!msg.webhookId} text="${msg.content.slice(0, 60)}"`,
  );
  const isLeadership = LEADERSHIP_CHANNELS.has(msg.channelId);
  const isCommunity = COMMUNITY_CHANNELS.has(msg.channelId);
  if (!isLeadership && !isCommunity) {
    console.log(`[skip] channel ${msg.channelId} not in allowlist`);
    return;
  }
  if (msg.webhookId) return;
  if (msg.author.bot) return;
  const text = msg.content.trim();
  if (!text) return;
  await handleCeoMessage(text, msg.channelId);
});

client.once("ready", () => {
  const guilds = client.guilds.cache.map((g) => `${g.name} (${g.id})`).join(", ");
  console.log(`[guilds] bot is in: ${guilds || "(none — bot is not in any server)"}`);
});

client.on("guildCreate", (g) => {
  console.log(`[joined] bot was added to: ${g.name} (${g.id})`);
});

client.login(BOT_TOKEN).catch((err) => {
  console.error("[login] failed:", err);
  process.exit(1);
});
