import "dotenv/config";

export type Network = "testnet" | "mainnet";

export interface Config {
  openrouterApiKey: string | null;
  hlNetwork: Network;
  hlAgentPrivateKey: `0x${string}`;
  hlLeaderAddress: `0x${string}`;
  hlVaultAddress: `0x${string}`;
  agentName: string;
  loopIntervalMs: number;
  maxPositionUsd: number;
  maxTotalExposureUsd: number;
  trackedSymbols: string[];
  twitterDryRun: boolean;
  twitter: {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
  };
  logDir: string;
  model: string;
  serverPort: number;
}

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing required env var: ${name}`);
  return v;
}

function asHex(name: string, v: string): `0x${string}` {
  if (!v.startsWith("0x")) throw new Error(`${name} must start with 0x`);
  return v as `0x${string}`;
}

function ensurePerp(s: string): string {
  return s.endsWith("-PERP") ? s : `${s}-PERP`;
}

export function loadConfig(): Config {
  const network = (process.env.HL_NETWORK ?? "testnet") as Network;
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error(`HL_NETWORK must be testnet|mainnet, got ${network}`);
  }
  return {
    openrouterApiKey: process.env.OPENROUTER_API_KEY || null,
    hlNetwork: network,
    hlAgentPrivateKey: asHex("HL_AGENT_PRIVATE_KEY", need("HL_AGENT_PRIVATE_KEY")),
    hlLeaderAddress: asHex("HL_LEADER_ADDRESS", need("HL_LEADER_ADDRESS")),
    hlVaultAddress: asHex("HL_VAULT_ADDRESS", need("HL_VAULT_ADDRESS")),
    agentName: process.env.AGENT_NAME ?? "Halcyon",
    loopIntervalMs: Number(process.env.LOOP_INTERVAL_SECONDS ?? "60") * 1000,
    maxPositionUsd: Number(process.env.MAX_POSITION_USD ?? "200"),
    maxTotalExposureUsd: Number(process.env.MAX_TOTAL_EXPOSURE_USD ?? "800"),
    trackedSymbols: (process.env.TRACKED_SYMBOLS ?? "PENDLE,JTO,HYPE")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(ensurePerp),
    twitterDryRun: (process.env.TWITTER_DRY_RUN ?? "true").toLowerCase() === "true",
    twitter: {
      appKey: process.env.TWITTER_API_KEY ?? "",
      appSecret: process.env.TWITTER_API_SECRET ?? "",
      accessToken: process.env.TWITTER_ACCESS_TOKEN ?? "",
      accessSecret: process.env.TWITTER_ACCESS_SECRET ?? "",
    },
    logDir: process.env.LOG_DIR ?? "./logs",
    model: process.env.MODEL ?? "anthropic/claude-sonnet-4.6",
    serverPort: Number(process.env.PORT ?? "8080"),
  };
}
