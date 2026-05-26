import { useEffect, useRef, useState } from "react";
import { fetchState } from "./api";
import type { AppState } from "./types";
import { AsciiBanner } from "./components/AsciiBanner";
import { StatusLine } from "./components/StatusLine";
import { TickerTape } from "./components/TickerTape";
import { VaultBar } from "./components/VaultBar";
import { AccountPanel } from "./components/AccountPanel";
import { PositionsTable } from "./components/PositionsTable";
import { MarketTable } from "./components/MarketTable";
import { DecisionsFeed } from "./components/DecisionsFeed";
import { TweetsFeed } from "./components/TweetsFeed";
import { DepositorsTable } from "./components/DepositorsTable";
import { TradesFeed } from "./components/TradesFeed";
import { CommandBar } from "./components/CommandBar";

const HISTORY_MAX = 48;

export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const s = await fetchState();
        if (cancelled) return;
        setState(s);
        setConnected(true);
        setHistory((prev) => {
          const next: Record<string, number[]> = { ...prev };
          for (const [sym, snap] of Object.entries(s.market)) {
            const series = next[sym] ?? [];
            const last = series[series.length - 1];
            if (last !== snap.markPrice) {
              next[sym] = [...series, snap.markPrice].slice(-HISTORY_MAX);
            }
          }
          return next;
        });
      } catch {
        if (!cancelled) setConnected(false);
      }
    }
    tick();
    timerRef.current = window.setInterval(tick, 3000);
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen scanlines max-w-[1600px] mx-auto w-full">
      <AsciiBanner state={state} connected={connected} />
      <StatusLine state={state} connected={connected} />
      <TickerTape market={state?.market ?? {}} />
      <VaultBar vault={state?.vault ?? null} />

      <div className="flex-1 px-6 py-3">
        {state ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4">
              <AccountPanel state={state} />
            </div>
            <div className="lg:col-span-4">
              <PositionsTable positions={state.positions} />
            </div>
            <div className="lg:col-span-4">
              <MarketTable market={state.market} history={history} />
            </div>

            <div className="lg:col-span-8">
              <DecisionsFeed decisions={state.decisions} />
            </div>
            <div className="lg:col-span-4">
              <DepositorsTable vault={state.vault} />
            </div>

            <div className="lg:col-span-8">
              <TweetsFeed tweets={state.tweets} />
            </div>
            <div className="lg:col-span-4">
              <TradesFeed trades={state.trades} />
            </div>
          </div>
        ) : (
          <div className="px-6 py-[60px] text-muted text-center text-[11px] font-mono uppercase tracking-[0.15em]">
            <span className="text-amber/60">::</span> initializing terminal
            <span className="pseudo-cursor"></span>
          </div>
        )}
      </div>

      <CommandBar state={state} />
    </div>
  );
}
