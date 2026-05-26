import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { EventLog } from "./log.js";
import type { Poster } from "./poster.js";
import type { VenueLike } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerDeps {
  agentName: string;
  venue: VenueLike;
  log: EventLog;
  poster: Poster;
  trackedSymbols: string[];
  bootedAt: string;
  network: string;
  twitterDryRun: boolean;
}

export function startServer(port: number, deps: ServerDeps): http.Server {
  // Resolve frontend/dist relative to this file. Works in dev (tsx, src/) and
  // prod (node dist/, after backend build).
  const distCandidates = [
    path.resolve(__dirname, "..", "frontend", "dist"),
    path.resolve(__dirname, "..", "..", "frontend", "dist"),
  ];
  const distDir = distCandidates.find((p) => fs.existsSync(p)) ?? distCandidates[0];
  const indexHtml = path.join(distDir, "index.html");

  const mimeTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".json": "application/json",
    ".woff2": "font/woff2",
  };

  function serveStatic(reqPath: string, res: http.ServerResponse): boolean {
    // strip query string, prevent path traversal
    const safeRel = reqPath.replace(/\.\./g, "").replace(/^\/+/, "");
    const filePath = path.join(distDir, safeRel);
    if (!filePath.startsWith(distDir)) return false;
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return false;
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": mimeTypes[ext] ?? "application/octet-stream",
      "cache-control": ext === ".html" ? "no-store" : "public, max-age=3600",
    });
    res.end(fs.readFileSync(filePath));
    return true;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

      if (url.pathname === "/" || url.pathname === "/index.html") {
        if (fs.existsSync(indexHtml)) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.end(fs.readFileSync(indexHtml));
        } else {
          res.writeHead(500, { "content-type": "text/plain" });
          res.end(
            "frontend not built. run `npm run build:frontend` first, or use `npm run dev` for hot reload at http://localhost:5173",
          );
        }
        return;
      }

      if (url.pathname === "/api/state") {
        const [market, positions, accountValue, vaultStats] = await Promise.all([
          deps.venue.marketState(deps.trackedSymbols),
          deps.venue.positions(),
          deps.venue.accountValue(),
          deps.venue.vaultStats(),
        ]);
        const decisions = deps.log.recent(20, ["decision"]);
        const trades = deps.log.recent(20, ["trade"]);
        const errors = deps.log.recent(5, ["error"]);
        const tweets = deps.poster.recent(20);

        const body = JSON.stringify({
          agent: deps.agentName,
          venue: deps.venue.label(),
          network: deps.network,
          twitterDryRun: deps.twitterDryRun,
          bootedAt: deps.bootedAt,
          tracked: deps.trackedSymbols,
          accountValue,
          vault: vaultStats,
          market,
          positions,
          decisions,
          trades,
          errors,
          tweets,
        });
        res.writeHead(200, {
          "content-type": "application/json",
          "cache-control": "no-store",
        });
        res.end(body);
        return;
      }

      // Try static asset (Vite emits hashed assets under /assets/)
      if (url.pathname.startsWith("/assets/") || url.pathname.match(/\.(js|css|svg|png|jpg|ico|woff2)$/i)) {
        if (serveStatic(url.pathname, res)) return;
      }

      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: msg }));
    }
  });

  server.listen(port, () => {
    console.log(`[${deps.agentName}] dashboard live at http://localhost:${port}`);
  });

  return server;
}
