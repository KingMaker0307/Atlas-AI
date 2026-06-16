import React from "react";
import { cn } from "@/lib/cn";
import { Surface } from "@/components/ui/card";

interface FitbitMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  detail?: string;
  icon?: React.ReactNode;
  tone?: "emerald" | "amber" | "rose" | "sky" | "violet";
  progress?: number; // 0 to 100 for SVG circular progress
  sparklineData?: number[]; // Optional list of numbers for a mini 7-day trend
  className?: string;
  onClick?: () => void;
}

const tones = {
  emerald: {
    bg: "from-emerald-500/5 to-teal-500/[0.01] border-emerald-500/15 hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    stroke: "text-emerald-500 dark:text-emerald-450",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    bg: "from-amber-500/5 to-yellow-500/[0.01] border-amber-500/15 hover:border-amber-500/30 text-amber-600 dark:text-amber-400",
    stroke: "text-amber-500 dark:text-amber-450",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  rose: {
    bg: "from-rose-500/5 to-red-500/[0.01] border-rose-500/15 hover:border-rose-500/30 text-rose-600 dark:text-rose-450",
    stroke: "text-rose-500 dark:text-rose-400",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  sky: {
    bg: "from-sky-500/5 to-cyan-500/[0.01] border-sky-500/15 hover:border-sky-500/30 text-sky-600 dark:text-sky-400",
    stroke: "text-sky-500 dark:text-sky-450",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  violet: {
    bg: "from-violet-500/5 to-fuchsia-500/[0.01] border-violet-500/15 hover:border-violet-500/30 text-violet-600 dark:text-violet-400",
    stroke: "text-violet-500 dark:text-violet-450",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
};

export function FitbitMetricCard({
  label,
  value,
  unit,
  detail,
  icon,
  tone = "emerald",
  progress,
  sparklineData,
  className,
  onClick,
}: FitbitMetricCardProps) {
  const currentTone = tones[tone];

  // Calculate sparkline polyline points if data is provided
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;

    const width = 56;
    const height = 20;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2; // 2px padding top/bottom
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="opacity-70 dark:opacity-85" aria-hidden="true">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <Surface
      onClick={onClick}
      className={cn(
        "bg-gradient-to-br transition-all duration-300 cursor-pointer select-none relative overflow-hidden flex flex-col justify-between p-4 min-h-[128px]",
        currentTone.bg,
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon ? (
            <div className={cn("p-1.5 rounded-xl shrink-0 flex items-center justify-center", currentTone.iconBg)}>
              {icon}
            </div>
          ) : null}
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 truncate">
            {label}
          </span>
        </div>

        {/* Circular Progress (Fitbit Target Gauge) */}
        {progress !== undefined ? (
          <div className="relative h-9 w-9 shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-zinc-150 dark:text-zinc-800"
              />
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="81.6"
                strokeDashoffset={81.6 - (81.6 * Math.min(progress, 100)) / 100}
                strokeLinecap="round"
                className={cn("transition-all duration-700 ease-out", currentTone.stroke)}
              />
            </svg>
            <span className="text-[10px] font-black text-zinc-850 dark:text-zinc-100">
              {Math.round(progress)}
              <span className="text-[8px] font-bold text-zinc-500">%</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Hero Metric & Sparkline Row */}
      <div className="mt-3.5 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline min-w-0">
          <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white truncate">
            {value}
          </span>
          {unit ? (
            <span className="ml-1 text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
              {unit}
            </span>
          ) : null}
        </div>

        {/* 7-Day Sparkline Trend */}
        {sparklineData ? (
          <div className={cn("shrink-0", currentTone.stroke)}>
            {renderSparkline()}
          </div>
        ) : null}
      </div>

      {/* Bottom Context Info */}
      {detail ? (
        <div className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-450 line-clamp-1 leading-snug">
          {detail}
        </div>
      ) : null}
    </Surface>
  );
}
