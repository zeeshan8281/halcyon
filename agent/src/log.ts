import fs from "node:fs";
import path from "node:path";
import type { LogEvent } from "./types.js";

export class EventLog {
  private file: string;

  constructor(logDir: string, fileName = "agent.jsonl") {
    fs.mkdirSync(logDir, { recursive: true });
    this.file = path.join(logDir, fileName);
  }

  write(event: LogEvent): void {
    const enriched = { ts: new Date().toISOString(), ...event };
    fs.appendFileSync(this.file, JSON.stringify(enriched) + "\n");
  }

  recent(n = 10, types?: string[]): LogEvent[] {
    if (!fs.existsSync(this.file)) return [];
    const lines = fs.readFileSync(this.file, "utf8").trim().split("\n");
    const parsed: LogEvent[] = [];
    for (const l of lines.slice(-500)) {
      if (!l) continue;
      try {
        const e = JSON.parse(l) as LogEvent;
        if (!types || types.includes(e.type)) parsed.push(e);
      } catch {
        // skip malformed line
      }
    }
    return parsed.slice(-n);
  }
}
