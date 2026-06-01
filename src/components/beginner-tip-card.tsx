"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface BeginnerTipCardProps {
  emoji: string;
  headline: string;
  body: string;
  cta?: string;
  onCta?: () => void;
  className?: string;
  variant?: "default" | "workout" | "nutrition" | "progress" | "coach";
}

const variantStyles: Record<NonNullable<BeginnerTipCardProps["variant"]>, string> = {
  default:   "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
  workout:   "from-violet-500/10 to-blue-500/10 border-violet-500/20",
  nutrition: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
  progress:  "from-sky-500/10 to-indigo-500/10 border-sky-500/20",
  coach:     "from-emerald-500/10 to-cyan-500/10 border-emerald-500/20",
};

const variantCta: Record<NonNullable<BeginnerTipCardProps["variant"]>, string> = {
  default:   "bg-emerald-500 hover:bg-emerald-600 text-white",
  workout:   "bg-violet-500 hover:bg-violet-600 text-white",
  nutrition: "bg-amber-500 hover:bg-amber-600 text-white",
  progress:  "bg-sky-500 hover:bg-sky-600 text-white",
  coach:     "bg-emerald-500 hover:bg-emerald-600 text-white",
};

export function BeginnerTipCard({
  emoji,
  headline,
  body,
  cta,
  onCta,
  className,
  variant = "default",
}: BeginnerTipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-5 space-y-3",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none select-none shrink-0" aria-hidden="true">
          {emoji}
        </span>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground leading-snug">{headline}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{body}</p>
        </div>
      </div>

      {cta && onCta && (
        <button
          type="button"
          onClick={onCta}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-bold transition-colors duration-150 cursor-pointer",
            variantCta[variant]
          )}
        >
          {cta}
        </button>
      )}
    </motion.div>
  );
}
