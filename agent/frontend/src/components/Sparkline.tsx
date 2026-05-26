const BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

export function Sparkline({
  values,
  width = 16,
  className = "",
}: {
  values: number[];
  width?: number;
  className?: string;
}) {
  if (!values || values.length === 0) {
    return <span className={`text-muted-2 font-mono ${className}`}>{"·".repeat(width)}</span>;
  }
  const sample = values.slice(-width);
  const min = Math.min(...sample);
  const max = Math.max(...sample);
  const range = max - min || 1;
  const last = sample[sample.length - 1]!;
  const first = sample[0]!;
  const trendColor =
    last > first ? "text-terminal" : last < first ? "text-red" : "text-muted";

  const chars = sample
    .map((v) => {
      const idx = Math.min(BLOCKS.length - 1, Math.max(0, Math.floor(((v - min) / range) * (BLOCKS.length - 1))));
      return BLOCKS[idx];
    })
    .join("");

  const padded = chars.padStart(width, " ");
  return <span className={`font-mono ${trendColor} ${className}`}>{padded}</span>;
}
