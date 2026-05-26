import type { Position } from "../types";
import { Empty, Panel } from "./Panel";
import { fmt, signClass } from "../utils/format";

export function PositionsTable({ positions }: { positions: Record<string, Position> }) {
  const keys = Object.keys(positions);

  return (
    <Panel title="POSITIONS" right={`${keys.length} open`}>
      {keys.length === 0 ? (
        <Empty>no open positions</Empty>
      ) : (
        <table className="w-full text-[11px] border-collapse tabular font-mono">
          <thead>
            <tr className="text-amber/60 border-b border-dashed border-amber/20">
              {["SYM", "SIDE", "SIZE", "ENTRY", "uPNL", "LVG"].map((h) => (
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
              const p = positions[k]!;
              const arrow = p.side === "LONG" ? "▲" : "▼";
              return (
                <tr
                  key={k}
                  className="border-b border-dashed border-amber/10 hover:bg-amber/[0.04]"
                >
                  <td className="px-3 py-[5px] text-amber">
                    <span className="text-amber/40 select-none">›</span>{" "}
                    {k.replace("-PERP", "")}
                  </td>
                  <td className={`px-3 py-[5px] ${p.side === "LONG" ? "text-terminal" : "text-red"}`}>
                    {arrow} {p.side}
                  </td>
                  <td className="px-3 py-[5px] text-text">{fmt.num(Math.abs(p.size))}</td>
                  <td className="px-3 py-[5px] text-muted">{fmt.num(p.entryPrice)}</td>
                  <td className={`px-3 py-[5px] ${signClass(p.unrealizedPnl)}`}>
                    {fmt.money(p.unrealizedPnl)}
                  </td>
                  <td className="px-3 py-[5px] text-muted">{p.leverage.toFixed(1)}x</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
