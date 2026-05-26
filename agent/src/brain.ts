import OpenAI from "openai";
import type { Decision, DecisionContext } from "./types.js";

/**
 * The brain. Goes through OpenRouter so we can swap models freely.
 *
 * Default model is Anthropic Claude Sonnet via OpenRouter; can be any model
 * OpenRouter supports (e.g. anthropic/claude-opus-4-7, openai/gpt-5,
 * deepseek/deepseek-r1, meta-llama/llama-4-405b-instruct, etc.).
 */
export class Brain {
  private client: OpenAI;
  private model: string;
  private system: string;

  constructor(apiKey: string, model: string, systemPrompt: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/agentic-micro-hedge",
        "X-Title": "Halcyon · Agentic Micro Hedge Fund",
      },
    });
    this.model = model;
    this.system = systemPrompt;
  }

  async decide(ctx: DecisionContext): Promise<Decision> {
    const vaultLine = ctx.vaultStats
      ? `VAULT: ${ctx.vaultStats.name} (${ctx.vaultStats.address})
  TVL: $${ctx.vaultStats.tvl.toFixed(2)}  ·  depositors: ${ctx.vaultStats.followerCount}  ·  apr: ${(ctx.vaultStats.apr * 100).toFixed(2)}%`
      : "VAULT: (stats unavailable this cycle)";

    const user = `Current state.

${vaultLine}

ACCOUNT VALUE (vault): $${ctx.accountValue.toFixed(2)}
MAX POSITION SIZE: $${ctx.maxPositionUsd}
MAX TOTAL EXPOSURE: $${ctx.maxTotalExposureUsd}

MARKET STATE:
${JSON.stringify(ctx.market, null, 2)}

CURRENT POSITIONS:
${Object.keys(ctx.positions).length ? JSON.stringify(ctx.positions, null, 2) : "none"}

RECENT ACTIONS (last 24h, most recent last):
${ctx.recentActions.length ? JSON.stringify(ctx.recentActions.slice(-10), null, 2) : "none"}

RECENT TWEETS (last 24h, most recent last):
${ctx.recentTweets.length ? JSON.stringify(ctx.recentTweets.slice(-10), null, 2) : "none"}

Decide.

Respond with a single JSON object matching this schema:
{
  "action": "HOLD" | "OPEN" | "CLOSE" | "ADJUST",
  "symbol": string | null,
  "side": "LONG" | "SHORT" | null,
  "sizeUsd": number | null,
  "reasoning": string,
  "tweet": string | null
}

Default to HOLD. Most cycles you do nothing. Trade only when the data
warrants it. Tweet only when there is something genuinely worth saying.

You are trading depositor capital. Be more conservative than you would be
with your own money.

JSON only. No markdown. No commentary.`;

    const resp = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: this.system },
        { role: "user", content: user },
      ],
    });

    const text = resp.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("brain returned empty response");

    let cleaned = text;
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
    }

    const raw = JSON.parse(cleaned);
    return {
      action: raw.action ?? "HOLD",
      symbol: raw.symbol ?? null,
      side: raw.side ?? null,
      sizeUsd: raw.sizeUsd ?? null,
      reasoning: raw.reasoning ?? "",
      tweet: raw.tweet ?? null,
    };
  }
}
