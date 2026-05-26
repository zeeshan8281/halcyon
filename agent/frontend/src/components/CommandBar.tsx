import type { AppState } from "../types";
import { fmt } from "../utils/format";

const F_KEYS: Array<[string, string]> = [
  ["F1", "HELP"],
  ["F2", "VAULT"],
  ["F3", "POS"],
  ["F4", "MARKET"],
  ["F5", "DECIDE"],
  ["F6", "TWEETS"],
  ["F7", "TRADES"],
  ["F8", "DEPOSIT"],
];

export function CommandBar({ state }: { state: AppState | null }) {
  const vault = state?.vault;
  const lastDec = state?.decisions?.[state.decisions.length - 1]?.decision;
  const cmd =
    lastDec?.action === "HOLD" || !lastDec
      ? "WATCH " + (state?.tracked?.[0] ?? "MARKET")
      : `${lastDec.action} ${lastDec.symbol ?? ""} ${lastDec.side ?? ""} ${lastDec.sizeUsd ? "$" + lastDec.sizeUsd : ""}`;

  return (
    <div className="border-t border-amber/30 bg-bg">
      <div className="h-[24px] flex items-center px-6 border-b border-amber/15 font-mono text-[11px]">
        <span className="text-amber font-semibold mr-2">halcyon</span>
        <span className="text-amber/60 mr-2">$</span>
        <span className="text-text tabular pseudo-cursor">{cmd}</span>
        <span className="ml-auto text-muted text-[10px] uppercase tracking-[0.12em]">
          {vault
            ? `vault ${vault.address.slice(0, 6)}…${vault.address.slice(-4)} · ${vault.followerCount} followers · ${fmt.moneyShort(vault.tvl)} aum`
            : "no vault connected"}
        </span>
      </div>
      <div className="h-[24px] flex items-center font-mono text-[10px] tracking-[0.1em] pl-3">
        {F_KEYS.map(([k, l], i) => (
          <div
            key={i}
            className="px-3 h-full flex items-center border-r border-amber/15 text-muted hover:text-amber cursor-default"
          >
            <span className="text-amber/60 mr-1">[</span>
            <span className="text-amber mr-1">{k}</span>
            <span className="text-text">{l}</span>
            <span className="text-amber/60 ml-1">]</span>
          </div>
        ))}
        <div className="ml-auto px-6 text-muted">
          <span className="text-terminal">●</span>&nbsp;attested · eigencompute tdx · agent-key approved · vault is on-chain
        </div>
      </div>
    </div>
  );
}
