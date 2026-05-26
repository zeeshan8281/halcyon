import type { ReactNode } from "react";

type Variant = "default" | "live" | "test" | "dry" | "purple" | "amber";

const variantClasses: Record<Variant, string> = {
  default: "text-muted border-border",
  live: "text-agent-green border-agent-green",
  test: "text-agent-blue border-agent-blue",
  dry: "text-agent-purple border-agent-purple",
  purple: "text-agent-purple border-agent-purple",
  amber: "text-agent-amber border-agent-amber",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`px-2 py-[3px] border rounded text-[11px] uppercase tracking-[0.05em] ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
