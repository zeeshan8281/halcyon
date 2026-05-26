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

export interface DecisionLog {
  ts: string;
  type: "decision";
  decision: Decision;
  accountValue: number;
  vaultTvl: number | null;
}

export interface TradeLog {
  ts: string;
  type: "trade";
  op: "open" | "close" | "adjust";
  symbol: string;
  side?: Side;
  sizeUsd?: number;
  result: unknown;
}

export interface TweetRecord {
  ts: string;
  text: string;
  status: "logged" | "posted" | "error";
  tweetId?: string;
  error?: string;
  dryRun: boolean;
}

export interface AppState {
  agent: string;
  venue: string;
  network: "testnet" | "mainnet";
  twitterDryRun: boolean;
  bootedAt: string;
  tracked: string[];
  accountValue: number;
  vault: VaultStats | null;
  market: Record<string, MarketSnapshot>;
  positions: Record<string, Position>;
  decisions: DecisionLog[];
  trades: TradeLog[];
  errors: unknown[];
  tweets: TweetRecord[];
}
