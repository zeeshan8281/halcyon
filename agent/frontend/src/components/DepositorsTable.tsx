import type { VaultStats } from "../types";
import { Empty, Panel } from "./Panel";
import { fmt, signClass } from "../utils/format";

export function DepositorsTable({ vault }: { vault: VaultStats | null }) {
  const followers = vault ? [...vault.followers].sort((a, b) => b.equity - a.equity) : [];

  return (
    <Panel
      title="DEPOSITORS · TOP 20"
      scroll
      right={vault ? `${vault.followerCount} total` : ""}
    >
      {followers.length === 0 ? (
        <Empty>no depositors yet — be first</Empty>
      ) : (
        <table className="w-full text-[11px] border-collapse tabular font-mono">
          <thead className="sticky top-0 bg-bg z-10">
            <tr className="text-amber/60 border-b border-dashed border-amber/20">
              {["#", "USER", "EQUITY", "PNL", "DAYS"].map((h) => (
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
            {followers.slice(0, 20).map((f, i) => (
              <tr
                key={i}
                className="border-b border-dashed border-amber/10 hover:bg-amber/[0.04]"
              >
                <td className="px-3 py-[5px] text-amber/60">
                  {(i + 1).toString().padStart(2, "0")}
                </td>
                <td className="px-3 py-[5px] text-text" title={f.user}>
                  {fmt.shortAddr(f.user)}
                </td>
                <td className="px-3 py-[5px]">{fmt.moneyShort(f.equity)}</td>
                <td className={`px-3 py-[5px] ${signClass(f.pnl)}`}>{fmt.money(f.pnl)}</td>
                <td className="px-3 py-[5px] text-muted">{f.daysFollowing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
