import type { ReactNode } from "react";

export function Panel({
  title,
  right,
  children,
  className = "",
  scroll = false,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  full?: boolean;
  scroll?: boolean;
}) {
  return (
    <div className={`bg-bg ${className}`}>
      <div className="flex items-center text-amber font-mono text-[11px] leading-none select-none px-1">
        <span>┌─[</span>
        <span className="px-1 text-amber font-semibold uppercase tracking-[0.18em]">{title}</span>
        <span>]</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap text-amber/40 mx-1">
          {"─".repeat(400)}
        </span>
        {right && (
          <>
            <span className="text-amber/40">[</span>
            <span className="text-muted text-[10px] uppercase tracking-[0.12em] font-sans px-1">
              {right}
            </span>
            <span className="text-amber/40">]</span>
            <span className="text-amber/40 mx-1">─</span>
          </>
        )}
        <span>┐</span>
      </div>

      <div className="border-l border-r border-amber/40">
        <div className={scroll ? "max-h-[320px] overflow-y-auto scrollbar-thin" : ""}>
          {children}
        </div>
      </div>

      <div className="flex items-center text-amber font-mono text-[11px] leading-none select-none px-1">
        <span>└</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap text-amber/40 mx-1">
          {"─".repeat(400)}
        </span>
        <span>┘</span>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="py-6 px-3 text-center text-muted text-[11px] font-mono">
      <span className="text-amber/40">::&nbsp;</span>
      {children}
      <span className="text-amber/40">&nbsp;::</span>
    </div>
  );
}
