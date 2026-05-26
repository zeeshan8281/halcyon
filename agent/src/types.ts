export type Side = "LONG" | "SHORT";
export type Action = "HOLD" | "OPEN" | "CLOSE" | "ADJUST";

export interface MarketSnapshot {
  markPrice: number;
  oraclePrice: number;
  funding: number;
  openInterest: number;
  dayVolumeUsd: number;
  premium: number;
}

export interface Position {
  size: number;
  side: Side;
  entryPrice: number;
  unrealizedPnl: number;
  leverage: number;
}

export interface Decision {
  action: Action;
  symbol: string | null;
  side: Side | null;
  sizeUsd: number | null;
  reasoning: string;
  tweet: string | null;
}

export interface DecisionContext {
  market: Record<string, MarketSnapshot>;
  positions: Record<string, Position>;
  accountValue: number;
  vaultStats: VaultStats | null;
  recentActions: unknown[];
  recentTweets: unknown[];
  maxPositionUsd: number;
  maxTotalExposureUsd: number;
}

export interface LogEvent {
  ts?: string;
  type: string;
  [key: string]: unknown;
}

export interface VaultFollower {
  user: string;
  equity: number;
  pnl: number;
  allTimePnl: number;
  daysFollowing: number;
  lockupUntil: number;
}

export interface VaultStats {
  address: string;
  name: string;
  description: string;
  leader: string;
  apr: number;
  leaderFraction: number;
  leaderCommission: number;
  allowDeposits: boolean;
  isClosed: boolean;
  tvl: number;
  followerCount: number;
  followers: VaultFollower[];
  maxDistributable: number;
  maxWithdrawable: number;
}

export interface VenueLike {
  init(): Promise<void>;
  marketState(symbols: string[]): Promise<Record<string, MarketSnapshot>>;
  positions(): Promise<Record<string, Position>>;
  accountValue(): Promise<number>;
  vaultStats(): Promise<VaultStats | null>;
  marketOpen(symbol: string, side: Side, sizeUsd: number): Promise<unknown>;
  marketClose(symbol: string): Promise<unknown>;
  label(): string;
}
