import type { Action, DecisionLog } from "../types";
import { Empty, Panel } from "./Panel";
import { fmt } from "../utils/format";

const actionStyle: Record<Action, string> = {
  HOLD: "text-muted",
  OPEN: "text-terminal",
  CLOSE: "text-blue",
  ADJUST: "text-amber",
};

const actionGlyph: Record<Action, string> = {
  HOLD: "··",
  OPEN: "▶▶",
  CLOSE: "■■",
  ADJUST: "◆◆",
};

export function DecisionsFeed({ decisions }: { decisions: DecisionLog[] }) {
  const sorted = [...decisions].reverse();

  return (
    <Panel title="DECISIONS · BRAIN OUTPUT" scroll right={`${decisions.length} logged`}>
      {sorted.length === 0 ? (
        <Empty>awaiting first decision</Empty>
      ) : (
        sorted.map((d, i) => {
          const dec = d.decision;
          const sym = dec.symbol ? dec.symbol.replace("-PERP", "") : "";
          const side = dec.side ?? "";
          const sz = dec.sizeUsd ? "$" + dec.sizeUsd : "";
          const klass = actionStyle[dec.action];
          return (
            <div
              key={i}
              className="px-3 py-[8px] border-b border-dashed border-amber/10 last:border-b-0 hover:bg-amber/[0.04] font-mono"
            >
              <div className="flex items-center gap-3 mb-[4px] text-[11px]">
                <span className={`${klass} font-semibold`}>{actionGlyph[dec.action]}</span>
                <span className={`${klass} font-semibold uppercase tracking-[0.1em]`}>
                  {dec.action}
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
                  {fmt.ago(d.ts)}
                </span>
              </div>
              <div className="text-[11px] text-text leading-relaxed pl-2 border-l border-dashed border-amber/20">
                <span className="text-amber/40">└ </span>
                {dec.reasoning}
              </div>
            </div>
          );
        })
      )}
    </Panel>
  );
}
