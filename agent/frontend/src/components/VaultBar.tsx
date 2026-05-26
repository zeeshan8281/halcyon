import type { VaultStats } from "../types";
import { fmt, signClass } from "../utils/format";

export function VaultBar({ vault }: { vault: VaultStats | null }) {
  if (!vault) {
    return (
      <div className="border-b border-amber/30 bg-bg px-6 py-3 text-muted text-[11px] font-mono">
        <span className="text-red mr-2">[!!]</span>
        vault unavailable — verify HL_VAULT_ADDRESS
      </div>
    );
  }

  const aprPct = vault.apr * 100;
  const utilization = vault.maxDistributable
    ? Math.min(1, Math.max(0, vault.tvl / (vault.tvl + vault.maxDistributable)))
    : 0;

  return (
    <div className="border-b border-amber/30 bg-bg">
      <div className="px-6 py-3 border-b border-amber/15 flex items-baseline gap-4 flex-wrap font-mono">
        <span className="text-amber/40 select-none">┌──</span>
        <div>
          <span className="text-amber/40 text-[10px] uppercase tracking-[0.15em]">vault&nbsp;</span>
          <span className="text-amber font-semibold text-[14px] tracking-tight">{vault.name}</span>
        </div>
        <div className="text-muted text-[11px]">
          <span className="text-amber/40">[</span>
          <span className="tabular text-text">{vault.address}</span>
          <span className="text-amber/40">]</span>
        </div>
        {vault.description && (
          <div className="text-muted text-[11px] basis-full pl-6">
            <span className="text-amber/40">// </span>
            {vault.description}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 font-mono">
        <Cell label="TVL" value={fmt.moneyShort(vault.tvl)} accent="amber" large />
        <Cell label="DEPOSITORS" value={vault.followerCount.toString()} />
        <Cell
          label="APR"
          value={`${aprPct >= 0 ? "+" : ""}${aprPct.toFixed(2)}%`}
          colorClass={signClass(vault.apr)}
        />
        <Cell
          label="LEADER FEE"
          value={`${(vault.leaderCommission * 100).toFixed(0)}%`}
          sub="of profit"
        />
        <Cell
          label="LEADER STAKE"
          value={`${(vault.leaderFraction * 100).toFixed(2)}%`}
          sub={<UtilizationBar v={utilization} />}
        />
      </div>
    </div>
  );
}

function UtilizationBar({ v }: { v: number }) {
  const width = 14;
  const filled = Math.round(v * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return <span className="text-amber/70 font-mono text-[10px]">{bar}</span>;
}

function Cell({
  label,
  value,
  sub,
  accent,
  colorClass,
  large,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: "amber";
  colorClass?: string;
  large?: boolean;
}) {
  return (
    <div className="px-4 py-3 border-r border-amber/15 last:border-r-0">
      <div className="text-amber/40 text-[10px] uppercase tracking-[0.15em] mb-1">{label}</div>
      <div
        className={`${large ? "text-[22px]" : "text-[16px]"} font-semibold tabular ${accent === "amber" ? "text-amber" : colorClass ?? "text-text"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted mt-1">{sub}</div>}
    </div>
  );
}
