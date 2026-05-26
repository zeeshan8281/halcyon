import type { TweetRecord } from "../types";
import { Empty, Panel } from "./Panel";
import { fmt } from "../utils/format";

export function TweetsFeed({ tweets }: { tweets: TweetRecord[] }) {
  const sorted = [...tweets].reverse();

  return (
    <Panel title="TWEETS · PUBLIC WIRE" scroll right={`${tweets.length} posted`}>
      {sorted.length === 0 ? (
        <Empty>no tweets yet</Empty>
      ) : (
        sorted.map((t, i) => (
          <div
            key={i}
            className="px-3 py-[8px] border-b border-dashed border-amber/10 last:border-b-0 hover:bg-amber/[0.04] font-mono"
          >
            <div className="flex items-center gap-3 mb-[4px] text-[11px]">
              <span
                className={`uppercase tracking-[0.1em] font-semibold ${t.dryRun ? "text-yellow" : "text-terminal"}`}
              >
                {t.dryRun ? "[DRY]" : "[POSTED]"}
              </span>
              {t.tweetId && (
                <span className="text-muted text-[10px] tabular">#{t.tweetId.slice(-6)}</span>
              )}
              <span className="ml-auto text-muted text-[10px] uppercase tracking-[0.1em]">
                {fmt.ago(t.ts)}
              </span>
            </div>
            <div className="text-[12px] text-text leading-relaxed whitespace-pre-wrap pl-2 border-l border-dashed border-amber/20">
              <span className="text-amber/40">└ </span>
              {t.text}
            </div>
          </div>
        ))
      )}
    </Panel>
  );
}
