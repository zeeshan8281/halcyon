import type { AppState } from "../types";
import { fmt } from "../utils/format";

const LOGO = String.raw`
██╗  ██╗ █████╗ ██╗      ██████╗██╗   ██╗ ██████╗ ███╗   ██╗
██║  ██║██╔══██╗██║     ██╔════╝╚██╗ ██╔╝██╔═══██╗████╗  ██║
███████║███████║██║     ██║      ╚████╔╝ ██║   ██║██╔██╗ ██║
██╔══██║██╔══██║██║     ██║       ╚██╔╝  ██║   ██║██║╚██╗██║
██║  ██║██║  ██║███████╗╚██████╗   ██║   ╚██████╔╝██║ ╚████║
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝
`.replace(/^\n/, "");

export function AsciiBanner({ state, connected }: { state: AppState | null; connected: boolean }) {
  const depositLink = state?.vault
    ? (state.network === "testnet"
        ? "https://app.hyperliquid-testnet.xyz/vaults/"
        : "https://app.hyperliquid.xyz/vaults/") + state.vault.address
    : null;
  const live = !!state && connected;

  return (
    <div className="px-6 py-3 border-b border-amber/30 bg-bg">
      <div className="flex items-start gap-6 flex-wrap">
        <pre className="font-mono text-amber text-[10px] leading-[1.05] tracking-tight select-none">
          {LOGO}
        </pre>
        <div className="flex flex-col gap-1 pt-1 min-w-0">
          <div className="font-mono text-[11px] text-text">
            <span className="text-amber/60">// </span>
            agentic micro hedge fund · attested in eigencompute tdx
          </div>
          <div className="font-mono text-[11px] text-muted">
            <span className="text-amber/60">// </span>
            character is the product · vault is the hedge · tee is the trust
          </div>
          <div className="font-mono text-[11px] text-muted flex items-center gap-2 mt-1">
            <span className={live ? "text-terminal" : "text-red"}>
              {live ? "●" : "○"}
            </span>
            <span className={live ? "text-terminal" : "text-red"}>
              {live ? "ATTESTED · LIVE" : "OFFLINE"}
            </span>
            <span className="text-amber/40">│</span>
            <span className="text-muted">
              boot <span className="text-text">{fmt.ago(state?.bootedAt)}</span>
            </span>
            <span className="text-amber/40">│</span>
            <span className="text-muted">
              tracked <span className="text-text">{state?.tracked?.length ?? 0}</span>
            </span>
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          {depositLink && (
            <a
              href={depositLink}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-1 border border-amber text-amber hover:bg-amber hover:text-bg transition-colors"
            >
              [&nbsp;{state?.vault?.allowDeposits ? "DEPOSIT ▸" : "DEPOSITS CLOSED"}&nbsp;]
            </a>
          )}
          <div className="font-mono text-[10px] text-muted uppercase tracking-[0.12em]">
            net&nbsp;<span className={state?.network === "mainnet" ? "text-terminal" : "text-blue"}>
              {state?.network ?? "—"}
            </span>
            &nbsp;·&nbsp;venue&nbsp;<span className="text-text">{state?.venue ?? "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
