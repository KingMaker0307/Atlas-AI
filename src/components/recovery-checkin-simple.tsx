"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { todayKey } from "@/lib/id";

interface RecoveryCheckinSimpleProps {
  onSaved?: () => void;
  compact?: boolean;
}

type SliderKey = "sleep" | "soreness" | "energy";

interface SliderConfig {
  key: SliderKey;
  question: string;
  lowLabel: string;
  highLabel: string;
  lowEmoji: string;
  highEmoji: string;
  storeKey: "sleepHours" | "soreness" | "energy";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

const SLIDERS: SliderConfig[] = [
  {
    key: "sleep",
    question: "😴 How did you sleep?",
    lowLabel: "Terrible",
    highLabel: "Amazing",
    lowEmoji: "😩",
    highEmoji: "😄",
    storeKey: "sleepHours",
    min: 3,
    max: 10,
    step: 0.5,
    defaultValue: 7,
  },
  {
    key: "soreness",
    question: "💪 How do your muscles feel?",
    lowLabel: "Very sore",
    highLabel: "Fresh & ready",
    lowEmoji: "😣",
    highEmoji: "💪",
    storeKey: "soreness",
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 5,
  },
  {
    key: "energy",
    question: "⚡ How's your energy today?",
    lowLabel: "Exhausted",
    highLabel: "Full of energy",
    lowEmoji: "🥱",
    highEmoji: "⚡",
    storeKey: "energy",
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 5,
  },
];

// Map slider value → emoji for real-time feedback
function getSliderEmoji(config: SliderConfig, value: number): string {
  const pct = (value - config.min) / (config.max - config.min);
  if (pct < 0.25) return config.lowEmoji;
  if (pct < 0.6) return "😐";
  if (pct < 0.85) return "🙂";
  return config.highEmoji;
}

export function RecoveryCheckinSimple({ onSaved, compact = false }: RecoveryCheckinSimpleProps) {
  const logRecovery = useAtlasStore((s) => s.logRecovery);
  const recoveryLogs = useAtlasStore((s) => s.recoveryLogs);
  const last = recoveryLogs.at(-1);

  const [values, setValues] = useState<Record<SliderKey, number>>({
    sleep:    last?.sleepHours ?? 7,
    soreness: last?.soreness   ?? 5,
    energy:   last?.energy     ?? 5,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (key: SliderKey, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await logRecovery({
        id: todayKey(),
        date: todayKey(),
        sleepHours: values.sleep,
        soreness: values.soreness,
        stress: last?.stress ?? 5,
        readiness: Math.round(
          ((values.sleep - 3) / 7) * 40 +
          ((values.soreness - 1) / 9) * 30 +
          ((values.energy - 1) / 9) * 30
        ),
        energy: values.energy,
        note: "",
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved?.();
      }, 1200);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-2 py-8 text-center"
      >
        <span className="text-4xl">✅</span>
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Saved! Great job checking in.</p>
      </motion.div>
    );
  }

  return (
    <Card className={compact ? "p-4 space-y-4" : "p-5 space-y-5"}>
      {!compact && (
        <div>
          <h3 className="text-base font-bold text-foreground">How are you feeling today?</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            This helps us give you the right advice for today&apos;s session.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {SLIDERS.map((config) => {
          const val = values[config.key];
          const emoji = getSliderEmoji(config, val);
          const pct = ((val - config.min) / (config.max - config.min)) * 100;

          return (
            <div key={config.key} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`slider-${config.key}`}
                  className="text-sm font-semibold text-foreground"
                >
                  {config.question}
                </label>
                <motion.span
                  key={emoji}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-xl select-none"
                  aria-hidden="true"
                >
                  {emoji}
                </motion.span>
              </div>

              <input
                id={`slider-${config.key}`}
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={val}
                onChange={(e) => handleChange(config.key, Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500"
                style={{
                  background: `linear-gradient(to right, rgb(16,185,129) ${pct}%, rgb(228,228,231) ${pct}%)`,
                }}
                aria-valuemin={config.min}
                aria-valuemax={config.max}
                aria-valuenow={val}
                aria-label={config.question}
              />

              <div className="flex justify-between text-[10px] font-medium text-zinc-400 select-none">
                <span>{config.lowLabel}</span>
                <span>{config.highLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="primary"
        className="w-full"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Saving…
          </span>
        ) : (
          "Save how I'm feeling ✓"
        )}
      </Button>
    </Card>
  );
}
