export const fmt = {
  money(n: number | null | undefined): string {
    return (
      "$" +
      Number(n ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  },

  moneyShort(n: number | null | undefined): string {
    const v = Number(n ?? 0);
    if (Math.abs(v) >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
    if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
    if (Math.abs(v) >= 1e3) return "$" + (v / 1e3).toFixed(2) + "K";
    return "$" + v.toFixed(2);
  },

  num(n: number | null | undefined, d = 4): string {
    return Number(n ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  },

  pct(n: number | null | undefined, d = 4): string {
    return ((Number(n ?? 0)) * 100).toFixed(d) + "%";
  },

  ago(iso: string | null | undefined): string {
    if (!iso) return "—";
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return s + "s ago";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  },

  shortAddr(a: string | null | undefined): string {
    if (!a) return "—";
    return a.slice(0, 6) + "…" + a.slice(-4);
  },
};

export function signClass(n: number | null | undefined): string {
  const v = Number(n);
  if (v > 0) return "text-agent-green";
  if (v < 0) return "text-agent-red";
  return "text-text";
}
