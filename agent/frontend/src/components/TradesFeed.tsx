import type { TradeLog } from "../types";
import { Empty, Panel } from "./Panel";
import { fmt } from "../utils/format";

const opGlyph: Record<string, string> = {
  open: "▶",
  close: "■",
  adjust: "◆",
};

const opColor: Record<string, string> = {
  open: "text-terminal",
  close: "text-blue",
  adjust: "text-amber",
};

export function TradesFeed({ trades }: { trades: TradeLog[] }) {
  const sorted = [...trades].reverse();

  return (
    <Panel title="TRADES · EXCHANGE LOG" scroll right={`${trades.length} fills`}>
      {sorted.length === 0 ? (
        <Empty>no trades yet</Empty>
      ) : (
        sorted.map((t, i) => {
          const op = t.op || "trade";
          const sym = t.symbol ? t.symbol.replace("-PERP", "") : "";
          const side = t.side || "";
          const sz = t.sizeUsd ? "$" + t.sizeUsd : "";
          const resultJson = JSON.stringify(t.result ?? {}).slice(0, 200);
          const color = opColor[op] ?? "text-muted";
          return (
            <div
              key={i}
              className="px-3 py-[8px] border-b border-dashed border-amber/10 last:border-b-0 hover:bg-amber/[0.04] font-mono"
            >
              <div className="flex items-center gap-3 mb-[4px] text-[11px]">
                <span className={`${color} font-semibold`}>{opGlyph[op] ?? "·"}</span>
                <span className={`${color} font-semibold uppercase tracking-[0.1em]`}>
                  {op}
                </span>
                {sym && <span className="text-amber font-semibold">{sym}</span>}
                {side && (
                  <span
                    className={`uppercase tracking-[0.1em] ${side === "LONG" ? "text-terminal" : "text-red"}`}
                  >
                    {side}
                  </span>
                )}
                {sz && <span className="text-text tabular">{sz}</span>}
                <span className="ml-auto text-muted text-[10px] uppercase tracking-[0.1em]">
                  {fmt.ago(t.ts)}
                </span>
              </div>
              <div className="text-[10px] text-muted/80 tabular break-all pl-2 border-l border-dashed border-amber/20">
                <span className="text-amber/40">└ </span>
                {resultJson}
              </div>
            </div>
          );
        })
      )}
    </Panel>
  );
}
