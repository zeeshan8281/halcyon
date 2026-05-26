import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error("OPENROUTER_API_KEY missing in .env");

const client = new OpenAI({
  apiKey,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://halcyon.local",
    "X-Title": "Halcyon HQ",
  },
});

export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function callClaude(opts: {
  model: string;
  system: string;
  messages: ChatMsg[];
  maxTokens?: number;
}): Promise<string> {
  const resp = await client.chat.completions.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 600,
    messages: [
      { role: "system", content: opts.system },
      ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });
  return resp.choices[0]?.message?.content?.trim() ?? "";
}
