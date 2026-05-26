import { Hyperliquid } from "hyperliquid";
import type { MarketSnapshot, Position, Side, VaultStats, VenueLike } from "./types.js";
import type { Network } from "./config.js";

/**
 * Hyperliquid venue trading on behalf of a vault.
 *
 * Architecture:
 *   - Leader address creates and owns a Hyperliquid vault.
 *   - Leader calls approveAgent(<agent address>) to authorize the agent key.
 *   - Agent key signs orders that include `vaultAddress` — Hyperliquid routes
 *     them as vault trades. Profits/losses accrue to the vault.
 *   - Anyone in the world can deposit into the vault. Hyperliquid handles
 *     NAV, lockup, fee accrual, redemptions natively.
 *
 * The agent key cannot withdraw — only the leader can move funds, and only
 * via vault redemption mechanics. That is the hedge fund.
 */
export class HyperliquidVenue implements VenueLike {
  private sdk: Hyperliquid;
  private leaderAddress: `0x${string}`;
  private vaultAddress: `0x${string}`;
  private network: Network;

  constructor(
    network: Network,
    agentPrivateKey: `0x${string}`,
    leaderAddress: `0x${string}`,
    vaultAddress: `0x${string}`,
  ) {
    this.network = network;
    this.leaderAddress = leaderAddress;
    this.vaultAddress = vaultAddress;
    this.sdk = new Hyperliquid({
      privateKey: agentPrivateKey,
      walletAddress: leaderAddress,
      vaultAddress,
      testnet: network === "testnet",
      enableWs: false,
    });
  }

  label(): string {
    return `hyperliquid:${this.network}:vault`;
  }

  async init(): Promise<void> {
    await this.sdk.connect();
  }

  async marketState(symbols: string[]): Promise<Record<string, MarketSnapshot>> {
    const [meta, ctxs] = await this.sdk.info.perpetuals.getMetaAndAssetCtxs();
    const idx = new Map<string, number>();
    (meta.universe ?? []).forEach((a: any, i: number) => idx.set(a.name, i));

    const out: Record<string, MarketSnapshot> = {};
    for (const s of symbols) {
      const i = idx.get(s);
      if (i === undefined) continue;
      const c: any = ctxs[i] ?? {};
      out[s] = {
        markPrice: Number(c.markPx ?? 0),
        oraclePrice: Number(c.oraclePx ?? 0),
        funding: Number(c.funding ?? 0),
        openInterest: Number(c.openInterest ?? 0),
        dayVolumeUsd: Number(c.dayNtlVlm ?? 0),
        premium: Number(c.premium ?? 0),
      };
    }
    return out;
  }

  private async getClearinghouseStateSafe(): Promise<any | null> {
    try {
      return await this.sdk.info.perpetuals.getClearinghouseState(this.vaultAddress);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // 401 "User not found" → the vault address has no HL account (demo /
      // dashboard-only mode). Return null and let callers degrade gracefully.
      if (msg.includes("401") || msg.includes("User not found")) return null;
      throw e;
    }
  }

  async positions(): Promise<Record<string, Position>> {
    const state = await this.getClearinghouseStateSafe();
    const out: Record<string, Position> = {};
    if (!state) return out;
    for (const p of state.assetPositions ?? []) {
      const pos = p.position ?? p;
      const sz = Number(pos.szi ?? 0);
      if (sz === 0) continue;
      const coin = pos.coin?.endsWith("-PERP") ? pos.coin : `${pos.coin}-PERP`;
      out[coin] = {
        size: sz,
        side: sz > 0 ? "LONG" : "SHORT",
        entryPrice: Number(pos.entryPx ?? 0),
        unrealizedPnl: Number(pos.unrealizedPnl ?? 0),
        leverage: Number(pos.leverage?.value ?? 1),
      };
    }
    return out;
  }

  async accountValue(): Promise<number> {
    const state = await this.getClearinghouseStateSafe();
    return Number(state?.marginSummary?.accountValue ?? 0);
  }

  async vaultStats(): Promise<VaultStats | null> {
    try {
      const v: any = await (this.sdk.info as any).generalAPI.getVaultDetails(this.vaultAddress);
      if (!v) return null;
      const followers = (v.followers ?? []).map((f: any) => ({
        user: String(f.user),
        equity: Number(f.vaultEquity ?? 0),
        pnl: Number(f.pnl ?? 0),
        allTimePnl: Number(f.allTimePnl ?? 0),
        daysFollowing: Number(f.daysFollowing ?? 0),
        lockupUntil: Number(f.lockupUntil ?? 0),
      }));
      const tvl = followers.reduce((s: number, f: { equity: number }) => s + f.equity, 0);
      return {
        address: this.vaultAddress,
        name: String(v.name ?? "vault"),
        description: String(v.description ?? ""),
        leader: String(v.leader ?? this.leaderAddress),
        apr: Number(v.apr ?? 0),
        leaderFraction: Number(v.leaderFraction ?? 0),
        leaderCommission: Number(v.leaderCommission ?? 0),
        allowDeposits: Boolean(v.allowDeposits ?? false),
        isClosed: Boolean(v.isClosed ?? false),
        tvl,
        followerCount: followers.length,
        followers: followers.slice(0, 50),
        maxDistributable: Number(v.maxDistributable ?? 0),
        maxWithdrawable: Number(v.maxWithdrawable ?? 0),
      };
    } catch {
      return null;
    }
  }

  async marketOpen(symbol: string, side: Side, sizeUsd: number): Promise<unknown> {
    const ms = await this.marketState([symbol]);
    const m = ms[symbol];
    if (!m) throw new Error(`unknown symbol: ${symbol}`);
    const sz = Number((sizeUsd / m.markPrice).toFixed(4));
    const limitPx =
      side === "LONG"
        ? Number((m.markPrice * 1.03).toFixed(6))
        : Number((m.markPrice * 0.97).toFixed(6));
    return (this.sdk.exchange as any).placeOrder({
      coin: symbol,
      is_buy: side === "LONG",
      sz,
      limit_px: limitPx,
      order_type: { limit: { tif: "Ioc" } },
      reduce_only: false,
      vaultAddress: this.vaultAddress,
    });
  }

  async marketClose(symbol: string): Promise<unknown> {
    const positions = await this.positions();
    const pos = positions[symbol];
    if (!pos) return { status: "noop", reason: `no position for ${symbol}` };
    const ms = await this.marketState([symbol]);
    const m = ms[symbol];
    if (!m) throw new Error(`unknown symbol: ${symbol}`);

    const closeSide: Side = pos.side === "LONG" ? "SHORT" : "LONG";
    const limitPx =
      closeSide === "LONG"
        ? Number((m.markPrice * 1.03).toFixed(6))
        : Number((m.markPrice * 0.97).toFixed(6));
    return (this.sdk.exchange as any).placeOrder({
      coin: symbol,
      is_buy: closeSide === "LONG",
      sz: Math.abs(pos.size),
      limit_px: limitPx,
      order_type: { limit: { tif: "Ioc" } },
      reduce_only: true,
      vaultAddress: this.vaultAddress,
    });
  }
}
