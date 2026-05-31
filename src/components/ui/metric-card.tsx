import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Surface } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "emerald" | "amber" | "rose" | "sky" | "violet";
  className?: string;
  onClick?: () => void;
}

const tones = {
  emerald: "from-emerald-500/5 to-teal-500/[0.01] border-emerald-500/15 text-emerald-600 dark:text-emerald-450",
  amber: "from-amber-500/5 to-yellow-500/[0.01] border-amber-500/15 text-amber-600 dark:text-amber-450",
  rose: "from-rose-500/5 to-red-500/[0.01] border-rose-500/15 text-rose-600 dark:text-rose-450",
  sky: "from-sky-500/5 to-cyan-500/[0.01] border-sky-500/15 text-sky-600 dark:text-sky-450",
  violet: "from-violet-500/5 to-fuchsia-500/[0.01] border-violet-500/15 text-violet-600 dark:text-violet-455",
};

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "emerald",
  className,
  onClick,
}: MetricCardProps) {
  return (
    <Surface
      onClick={onClick}
      className={cn(
        "bg-gradient-to-br transition-all duration-300",
        tones[tone],
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-750 dark:text-zinc-400">
          {label}
        </span>
        {icon ? <span className="text-current shrink-0">{icon}</span> : null}
      </div>
      <div className="mt-3 text-xl sm:text-2xl font-black tracking-tight text-zinc-955 dark:text-white">
        {value}
      </div>
      {detail ? (
        <div className="mt-1.5 text-xs font-medium text-zinc-555 dark:text-zinc-500">
          {detail}
        </div>
      ) : null}
    </Surface>
  );
}
