import { loadConfig } from "./config.js";
import { HyperliquidVenue } from "./venue.js";
import { Brain } from "./brain.js";
import { Poster } from "./poster.js";
import { EventLog } from "./log.js";
import { systemPrompt } from "./persona.js";
import { startServer } from "./server.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const cfg = loadConfig();
  const log = new EventLog(cfg.logDir);

  const venue = new HyperliquidVenue(
    cfg.hlNetwork,
    cfg.hlAgentPrivateKey,
    cfg.hlLeaderAddress,
    cfg.hlVaultAddress,
  );
  await venue.init();

  const brain = cfg.openrouterApiKey
    ? new Brain(cfg.openrouterApiKey, cfg.model, systemPrompt(cfg.agentName))
    : null;
  const poster = new Poster(cfg.twitterDryRun, cfg.logDir, cfg.twitter);

  if (!brain) {
    console.log(
      `[${cfg.agentName}] no OPENROUTER_API_KEY set — dashboard-only mode (no decisions, no trades).`,
    );
  } else {
    console.log(`[${cfg.agentName}] brain online via openrouter, model=${cfg.model}`);
  }

  const bootedAt = new Date().toISOString();

  // Pull initial vault stats so we can confirm the vault exists + is reachable.
  const initialVault = await venue.vaultStats();
  if (initialVault) {
    console.log(
      `[${cfg.agentName}] vault ${initialVault.name} (${initialVault.address}) tvl=$${initialVault.tvl.toFixed(2)} depositors=${initialVault.followerCount}`,
    );
  } else {
    console.log(`[${cfg.agentName}] WARNING: could not load vault stats — verify HL_VAULT_ADDRESS`);
  }

  log.write({
    type: "boot",
    agent: cfg.agentName,
    venue: venue.label(),
    network: cfg.hlNetwork,
    leaderAddress: cfg.hlLeaderAddress,
    vaultAddress: cfg.hlVaultAddress,
    vaultName: initialVault?.name ?? null,
    vaultTvl: initialVault?.tvl ?? null,
    tracked: cfg.trackedSymbols,
    twitterDryRun: cfg.twitterDryRun,
    model: cfg.model,
  });
  console.log(
    `[${cfg.agentName}] boot. venue=${venue.label()} symbols=${cfg.trackedSymbols.join(",")} twitter=${cfg.twitterDryRun ? "dry" : "live"}`,
  );

  startServer(cfg.serverPort, {
    agentName: cfg.agentName,
    venue,
    log,
    poster,
    trackedSymbols: cfg.trackedSymbols,
    bootedAt,
    network: cfg.hlNetwork,
    twitterDryRun: cfg.twitterDryRun,
  });

  let stopping = false;
  process.on("SIGINT", () => {
    console.log(`\n[${cfg.agentName}] shutdown signal`);
    log.write({ type: "shutdown", reason: "sigint" });
    stopping = true;
  });

  while (!stopping) {
    const t0 = Date.now();
    try {
      const [market, positions, accountValue, vaultStats] = await Promise.all([
        venue.marketState(cfg.trackedSymbols),
        venue.positions(),
        venue.accountValue(),
        venue.vaultStats(),
      ]);

      if (!brain) {
        // Dashboard-only mode: skip the decide/trade/post block. Server still
        // serves /api/state so the UI populates with vault + market data.
        const elapsed = Date.now() - t0;
        const wait = Math.max(0, cfg.loopIntervalMs - elapsed);
        if (!stopping) await sleep(wait);
        continue;
      }

      const decision = await brain.decide({
        market,
        positions,
        accountValue,
        vaultStats,
        recentActions: log.recent(10, ["decision", "trade"]),
        recentTweets: poster.recent(10),
        maxPositionUsd: cfg.maxPositionUsd,
        maxTotalExposureUsd: cfg.maxTotalExposureUsd,
      });

      log.write({
        type: "decision",
        decision,
        accountValue,
        vaultTvl: vaultStats?.tvl ?? null,
        marketKeys: Object.keys(market),
      });
      console.log(
        `[${cfg.agentName}] ${decision.action} ${decision.symbol ?? ""} ${decision.side ?? ""} ${decision.sizeUsd ?? ""}`,
      );
      if (decision.reasoning) console.log(`  reason: ${decision.reasoning}`);

      const sizeUsd = decision.sizeUsd
        ? Math.min(decision.sizeUsd, cfg.maxPositionUsd)
        : null;

      if (decision.action === "OPEN" && decision.symbol && decision.side && sizeUsd) {
        const result = await venue.marketOpen(decision.symbol, decision.side, sizeUsd);
        log.write({
          type: "trade",
          op: "open",
          symbol: decision.symbol,
          side: decision.side,
          sizeUsd,
          result,
        });
      } else if (decision.action === "CLOSE" && decision.symbol) {
        const result = await venue.marketClose(decision.symbol);
        log.write({ type: "trade", op: "close", symbol: decision.symbol, result });
      } else if (decision.action === "ADJUST" && decision.symbol && decision.side && sizeUsd) {
        const closeResult = await venue.marketClose(decision.symbol);
        const openResult = await venue.marketOpen(decision.symbol, decision.side, sizeUsd);
        log.write({
          type: "trade",
          op: "adjust",
          symbol: decision.symbol,
          side: decision.side,
          sizeUsd,
          result: { close: closeResult, open: openResult },
        });
      }

      if (decision.tweet) {
        const rec = await poster.post(decision.tweet);
        console.log(`[${cfg.agentName}] tweet (${rec.status}): ${decision.tweet}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.write({ type: "error", error: msg });
      console.error(`[${cfg.agentName}] ERROR: ${msg}`);
    }

    const elapsed = Date.now() - t0;
    const wait = Math.max(0, cfg.loopIntervalMs - elapsed);
    if (!stopping) await sleep(wait);
  }
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
