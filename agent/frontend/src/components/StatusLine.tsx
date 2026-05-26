import { useEffect, useState } from "react";
import type { AppState } from "../types";
import { fmt } from "../utils/format";

function useClock(): string {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}Z`;
}

function Sep() {
  return <span className="text-amber/40 px-2 select-none">│</span>;
}

export function StatusLine({ state, connected }: { state: AppState | null; connected: boolean }) {
  const clock = useClock();
  const host = "eigencompute-tdx-tokyo-01";
  const vault = state?.vault;

  return (
    <div className="h-[22px] border-b border-amber/30 bg-bg flex items-center text-[11px] font-mono tabular px-6 whitespace-nowrap overflow-hidden">
      <span className={connected ? "text-terminal" : "text-red"}>{connected ? "●" : "○"}</span>
      <span className="text-amber font-semibold pl-2 uppercase tracking-[0.1em]">
        {state?.agent ?? "—"}
      </span>
      <Sep />
      <span className="text-muted">host</span>
      <span className="text-text pl-1">{host}</span>
      <Sep />
      <span className="text-muted">net</span>
      <span className={`pl-1 ${state?.network === "mainnet" ? "text-terminal" : "text-blue"}`}>
        {(state?.network ?? "—").toUpperCase()}
      </span>
      <Sep />
      <span className="text-muted">tw</span>
      <span className={`pl-1 ${state?.twitterDryRun ? "text-yellow" : "text-terminal"}`}>
        {state?.twitterDryRun ? "DRY" : "LIVE"}
      </span>
      <Sep />
      <span className="text-muted">tvl</span>
      <span className="text-amber pl-1">{vault ? fmt.moneyShort(vault.tvl) : "—"}</span>
      <Sep />
      <span className="text-muted">depositors</span>
      <span className="text-text pl-1">{vault?.followerCount ?? 0}</span>
      <Sep />
      <span className="text-muted">link</span>
      <span className={`pl-1 ${connected ? "text-terminal" : "text-red"}`}>
        {connected ? "UP" : "DOWN"}
      </span>
      <span className="ml-auto text-text">{clock}</span>
    </div>
  );
}
