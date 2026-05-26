import fs from "node:fs";
import path from "node:path";

const LOG_PATH = path.resolve("logs/messages.jsonl");

export type TranscriptItem = {
  ts: string;
  authorId: string; // "ceo" or persona id
  authorName: string;
  role: string; // "CEO" or persona role
  content: string;
  channelId?: string; // discord channel id (undefined for legacy entries)
};

export function appendLog(item: TranscriptItem): void {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(item) + "\n");
}

export function loadRecent(limit = 30): TranscriptItem[] {
  if (!fs.existsSync(LOG_PATH)) return [];
  const lines = fs.readFileSync(LOG_PATH, "utf8").trim().split("\n").filter(Boolean);
  const items: TranscriptItem[] = [];
  for (const line of lines.slice(-limit)) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // skip corrupt line
    }
  }
  return items;
}
