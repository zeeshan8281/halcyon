import type { AppState } from "./types";

export async function fetchState(): Promise<AppState> {
  const r = await fetch("/api/state");
  if (!r.ok) throw new Error(`state ${r.status}`);
  return r.json();
}
