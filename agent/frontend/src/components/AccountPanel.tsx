import type { AppState } from "../types";
import { Panel } from "./Panel";
import { fmt } from "../utils/format";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline px-3 py-[5px] border-b border-dashed border-amber/10 last:border-b-0 hover:bg-amber/[0.04] font-mono text-[11px]">
      <span className="text-amber/60 uppercase tracking-[0.12em] text-[10px]">{label}</span>
      <span className="flex-1 mx-2 text-amber/15 overflow-hidden whitespace-nowrap">
        {"·".repeat(200)}
      </span>
      <span className="text-text tabular">{value}</span>
    </div>
  );
}

export function AccountPanel({ state }: { state: AppState }) {
  return (
    <Panel title="ACCOUNT · VAULT">
      <Row label="vault nav" value={fmt.money(state.accountValue)} />
      <Row label="tracked symbols" value={state.tracked.length} />
      <Row label="open positions" value={Object.keys(state.positions).length} />
      <Row label="decisions logged" value={state.decisions.length} />
      <Row label="tweets posted" value={state.tweets.length} />
      <Row label="errors" value={state.errors.length} />
      <Row label="uptime" value={fmt.ago(state.bootedAt).replace(" ago", "")} />
    </Panel>
  );
}
