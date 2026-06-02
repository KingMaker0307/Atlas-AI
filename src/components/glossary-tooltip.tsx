"use client";

import React, { useState } from "react";
import { useAtlasStore } from "@/store/useAtlasStore";

// Hardcoded fitness definitions matching the glossary requirements
const DICTIONARY: Record<string, string> = {
  set: "A group of consecutive repetitions. For example, lifting a weight 10 times in a row without stopping is '1 set'.",
  sets: "Groups of consecutive repetitions. For example, doing 10 lifts, resting, and doing another 10 is '2 sets'.",
  rep: "A single complete movement of an exercise (e.g., one push-up or one squat). Short for repetition.",
  reps: "Multiple complete movements of an exercise (e.g., doing 10 push-ups in a row means doing 10 reps).",
  rest: "The recovery period between sets of exercises, letting your muscles and nervous system reload energy.",
  tdee: "Total Daily Energy Expenditure: The total number of calories your body burns in a day, including exercise and general activity.",
  macros: "Macronutrients: The three main nutrients your body needs in large amounts — Protein (for muscle recovery), Carbs (for daily energy), and Fats (for hormone health).",
  protein: "A crucial macronutrient used by the body to rebuild muscle fibers and recover from workouts.",
  carbs: "Carbohydrates: The body's primary and most efficient source of fuel and training energy.",
  fats: "A vital nutrient that supports hormone regulation, brain function, and joint health.",
};

interface GlossaryTooltipProps {
  term: string;
  children: React.ReactNode;
}

export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({ term, children }) => {
  const guidedMode = useAtlasStore((state) => state.guidedMode);
  const [visible, setVisible] = useState(false);

  const cleanTerm = term.toLowerCase().trim();
  const definition = DICTIONARY[cleanTerm];

  // If guidedMode is off or term is not in dictionary, render children normally
  if (!guidedMode || !definition) {
    return <>{children}</>;
  }

  return (
    <span 
      className="relative inline-block group"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={() => setVisible(!visible)}
    >
      <span className="underline decoration-dotted decoration-zinc-400 dark:decoration-zinc-550 underline-offset-4 cursor-help font-medium">
        {children}
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 dark:bg-zinc-950 text-white rounded-xl text-xs leading-relaxed shadow-xl border border-zinc-800 z-50 animate-in fade-in slide-in-from-bottom-1 pointer-events-none select-none">
          <span className="block font-bold uppercase tracking-wider text-[10px] text-emerald-400 mb-1">
            Fitness Guide: {term}
          </span>
          {definition}
        </span>
      )}
    </span>
  );
};
