import type { MarketSnapshot } from "../types";
import { fmt, signClass } from "../utils/format";

export function TickerTape({ market }: { market: Record<string, MarketSnapshot> }) {
  const entries = Object.entries(market);
  if (entries.length === 0) {
    return (
      <div className="h-[26px] border-b border-amber/30 bg-bg flex items-center px-6 text-[11px] text-muted font-mono">
        <span className="text-amber/40 mr-2">::</span>no market feed
      </div>
    );
  }

  const items = [...entries, ...entries];

  return (
    <div className="h-[26px] border-b border-amber/30 bg-bg overflow-hidden relative">
      <div
        className="absolute whitespace-nowrap flex items-center h-full animate-ticker-scroll"
        style={{ minWidth: "200%" }}
      >
        {items.map(([sym, m], i) => {
          const funding = m.funding;
          const dir = funding >= 0 ? "▲" : "▼";
          return (
            <div key={i} className="flex items-center h-full px-4 font-mono text-[11px] tabular">
              <span className="text-amber/40 mr-3 select-none">│</span>
              <span className={`mr-2 ${signClass(funding)}`}>{dir}</span>
              <span className="text-amber font-semibold mr-2">{sym.replace("-PERP", "")}</span>
              <span className="text-text mr-2">{fmt.num(m.markPrice, 4)}</span>
              <span className={`mr-2 ${signClass(funding)}`}>
                {funding >= 0 ? "+" : ""}
                {fmt.pct(funding, 3)}
              </span>
              <span className="text-muted">{fmt.moneyShort(m.dayVolumeUsd)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
