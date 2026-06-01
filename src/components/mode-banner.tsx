"use client";

import { motion } from "framer-motion";
import { useAtlasStore } from "@/store/useAtlasStore";
import { X, Leaf } from "lucide-react";
import { useState } from "react";

export function ModeBanner() {
  const guidedMode = useAtlasStore((s) => s.guidedMode);
  const profile = useAtlasStore((s) => s.profile);
  const [dismissed, setDismissed] = useState(false);

  // Only show for guided mode users within first 3 days of account creation
  if (!guidedMode || dismissed) return null;

  const createdAt = profile?.createdAt ? new Date(profile.createdAt) : null;
  const daysSince = createdAt
    ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  if (daysSince > 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="mx-3 mt-2 mb-0"
    >
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5">
        <Leaf size={14} className="text-emerald-500 shrink-0" aria-hidden="true" />
        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-snug flex-1">
          You&apos;re in{" "}
          <span className="font-bold">Guided Mode 🌱</span> — we&apos;ve simplified everything for you. Switch to{" "}
          <span className="font-bold">Expert Mode</span> any time in Settings.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}
