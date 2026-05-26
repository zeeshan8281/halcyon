import { type Persona } from "./personas.js";
import { callClaude, type ChatMsg } from "./claude.js";

function buildRouterSystem(roster: Persona[]): string {
  const rosterLines = roster.map((p) => `- ${p.id} — ${p.role}`).join("\n");
  const defaultId = roster.find((p) => p.id === "jordan")?.id ?? roster[0].id;
  return `
You are the routing layer for a fictional company group chat. The CEO has just posted a message.
Decide which 1–3 members of the leadership team would naturally chime in.

ACTIVE ROSTER (only these may be picked):
${rosterLines}

RULES
- Output ONLY a JSON array of 1–3 persona ids, in order of who speaks first. No prose, no fences.
- Pick the smallest set that's natural. If only one person would speak, return one.
- If the message is small-talk or unclear, default to ["${defaultId}"].
- If the message names a topic that clearly belongs to one function, prefer that function's owner.
- Never include an id that isn't in the active roster above.

Example outputs:
["${roster[0].id}"]
${roster.length >= 2 ? `["${roster[0].id}","${roster[1].id}"]` : ""}
`.trim();
}

export async function routeMessage(opts: {
  model: string;
  recent: ChatMsg[];
  roster: Persona[];
}): Promise<Persona[]> {
  const activeIds = new Set(opts.roster.map((p) => p.id));
  try {
    const raw = await callClaude({
      model: opts.model,
      system: buildRouterSystem(opts.roster),
      messages: opts.recent,
      maxTokens: 60,
    });
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return fallback(opts.roster);
    const ids = parsed.filter(
      (x): x is string => typeof x === "string" && activeIds.has(x)
    );
    if (ids.length === 0) return fallback(opts.roster);
    const seen = new Set<string>();
    const unique = ids.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
    return unique.slice(0, 3).map((id) => opts.roster.find((p) => p.id === id)!);
  } catch {
    return fallback(opts.roster);
  }
}

function fallback(roster: Persona[]): Persona[] {
  return [roster.find((p) => p.id === "jordan") ?? roster[0]];
}
