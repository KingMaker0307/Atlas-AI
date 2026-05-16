import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Surface } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "emerald" | "amber" | "rose" | "sky" | "violet";
}

const tones = {
  emerald: "from-emerald-300/18 to-teal-300/5 text-emerald-200",
  amber: "from-amber-300/18 to-yellow-300/5 text-amber-200",
  rose: "from-rose-300/18 to-red-300/5 text-rose-200",
  sky: "from-sky-300/18 to-cyan-300/5 text-sky-200",
  violet: "from-violet-300/18 to-fuchsia-300/5 text-violet-200",
};

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "emerald",
}: MetricCardProps) {
  return (
    <Surface className={cn("bg-gradient-to-br", tones[tone])}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</span>
        {icon ? <span className="text-current">{icon}</span> : null}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-normal text-white">{value}</div>
      {detail ? <div className="mt-1 text-sm text-zinc-400">{detail}</div> : null}
    </Surface>
  );
}
