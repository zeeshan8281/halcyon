import fs from "node:fs";
import path from "node:path";
import { TwitterApi } from "twitter-api-v2";

export interface TweetCreds {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

export interface TweetRecord {
  ts: string;
  text: string;
  status: "logged" | "posted" | "error";
  tweetId?: string;
  error?: string;
  dryRun: boolean;
}

export class Poster {
  private dryRun: boolean;
  private tweetsFile: string;
  private client: TwitterApi | null;

  constructor(dryRun: boolean, logDir: string, creds: TweetCreds) {
    this.dryRun = dryRun;
    fs.mkdirSync(logDir, { recursive: true });
    this.tweetsFile = path.join(logDir, "tweets.jsonl");

    if (!dryRun && creds.appKey && creds.appSecret && creds.accessToken && creds.accessSecret) {
      this.client = new TwitterApi({
        appKey: creds.appKey,
        appSecret: creds.appSecret,
        accessToken: creds.accessToken,
        accessSecret: creds.accessSecret,
      });
    } else {
      this.client = null;
    }
  }

  async post(text: string): Promise<TweetRecord> {
    const rec: TweetRecord = {
      ts: new Date().toISOString(),
      text,
      status: "logged",
      dryRun: this.dryRun,
    };

    if (!this.dryRun && this.client) {
      try {
        const resp = await this.client.v2.tweet(text);
        rec.status = "posted";
        rec.tweetId = resp.data?.id;
      } catch (e) {
        rec.status = "error";
        rec.error = e instanceof Error ? e.message : String(e);
      }
    }

    fs.appendFileSync(this.tweetsFile, JSON.stringify(rec) + "\n");
    return rec;
  }

  recent(n = 10): TweetRecord[] {
    if (!fs.existsSync(this.tweetsFile)) return [];
    const lines = fs.readFileSync(this.tweetsFile, "utf8").trim().split("\n");
    return lines
      .slice(-n)
      .filter(Boolean)
      .map((l) => JSON.parse(l) as TweetRecord);
  }
}
