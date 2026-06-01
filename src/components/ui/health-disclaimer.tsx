"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "atlas.disclaimer.accepted";

export function HealthDisclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setVisible(true);
    } catch {
      // SSR or storage unavailable
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {}
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="health-disclaimer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
          role="alertdialog"
          aria-modal="false"
          aria-label="Health data disclaimer"
        >
          <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-zinc-950/95 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck size={16} />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Health Disclaimer
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Atlas AI is not a medical device. All content is for
                informational purposes only and does not constitute medical
                advice. Consult a qualified healthcare professional before
                making health or fitness decisions.
              </p>
              <button
                id="health-disclaimer-accept"
                onClick={dismiss}
                className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                I understand
              </button>
            </div>

            <button
              onClick={dismiss}
              aria-label="Dismiss health disclaimer"
              className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
