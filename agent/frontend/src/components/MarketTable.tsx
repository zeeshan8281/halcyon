import type { MarketSnapshot } from "../types";
import { Empty, Panel } from "./Panel";
import { Sparkline } from "./Sparkline";
import { fmt, signClass } from "../utils/format";

export function MarketTable({
  market,
  history,
}: {
  market: Record<string, MarketSnapshot>;
  history: Record<string, number[]>;
}) {
  const keys = Object.keys(market);

  return (
    <Panel title="MARKET · PERPS" right={`${keys.length} sym`}>
      {keys.length === 0 ? (
        <Empty>no market data</Empty>
      ) : (
        <table className="w-full text-[11px] border-collapse tabular font-mono">
          <thead>
            <tr className="text-amber/60 border-b border-dashed border-amber/20">
              {["SYM", "MARK", "Δ", "FUND", "TREND", "VOL"].map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-[5px] text-[10px] uppercase tracking-[0.12em] font-mono"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const m = market[k]!;
              const drift = m.markPrice - m.oraclePrice;
              return (
                <tr
                  key={k}
                  className="border-b border-dashed border-amber/10 hover:bg-amber/[0.04]"
                >
                  <td className="px-3 py-[5px] text-amber">
                    <span className="text-amber/40 select-none">›</span>{" "}
                    {k.replace("-PERP", "")}
                  </td>
                  <td className="px-3 py-[5px] text-text">{fmt.num(m.markPrice)}</td>
                  <td className={`px-3 py-[5px] ${signClass(drift)}`}>
                    {drift >= 0 ? "+" : ""}
                    {fmt.num(drift, 4)}
                  </td>
                  <td className={`px-3 py-[5px] ${signClass(m.funding)}`}>
                    {(m.funding >= 0 ? "+" : "") + fmt.pct(m.funding, 4)}
                  </td>
                  <td className="px-3 py-[5px]">
                    <Sparkline values={history[k] ?? []} width={14} />
                  </td>
                  <td className="px-3 py-[5px] text-muted">
                    {fmt.moneyShort(m.dayVolumeUsd)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
