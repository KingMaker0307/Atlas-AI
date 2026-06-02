"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Authenticating your session...",
  "Syncing your workouts...",
  "Loading nutrition data...",
  "Fetching recovery logs...",
  "Preparing your dashboard...",
];

interface AppLoaderProps {
  visible: boolean;
}

export function AppLoader({ visible }: AppLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const msgTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 1200);

    const dotTimer = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 400);

    return () => {
      clearInterval(msgTimer);
      clearInterval(dotTimer);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="app-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950"
          aria-label="Loading Atlas AI"
          role="status"
        >
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-teal-500/3 blur-[80px]" />
          </div>

          <div className="relative flex flex-col items-center gap-8 select-none">
            {/* Logo mark */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulse ring */}
              <motion.div
                className="absolute w-28 h-28 rounded-full border border-emerald-500/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Middle pulse ring */}
              <motion.div
                className="absolute w-20 h-20 rounded-full border border-emerald-500/30"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
              {/* Core icon */}
              <motion.div
                className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_0_40px_rgba(16,185,129,0.35)]"
                animate={{ rotate: [0, 0, 0] }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-zinc-950"
                  aria-hidden="true"
                >
                  <path
                    d="M6 22L12 10L16 18L20 14L26 22"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="16" cy="8" r="2.5" fill="currentColor" opacity="0.6" />
                </svg>
              </motion.div>
            </div>

            {/* App name */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Atlas <span className="text-emerald-400">AI</span>
              </h1>
              <p className="text-xs font-semibold text-zinc-500 tracking-widest uppercase">
                Your Personal Coach
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-48 h-0.5 rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Animated status message */}
            <div className="h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs text-zinc-500 font-medium"
                >
                  {MESSAGES[messageIndex]}
                  <span className="inline-block w-4">
                    {".".repeat(dots)}
                  </span>
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
