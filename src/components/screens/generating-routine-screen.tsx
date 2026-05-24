"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Exercise } from "@/types/domain";

function buildOnboardingPrompt(profile: any): string {
  const exerciseSchema: Exercise = {
    id: "string (e.g., 'barbell-bench-press')",
    name: "string (e.g., 'Barbell Bench Press')",
    category: "'compound' | 'isolation' | 'cardio' | 'mobility'",
    muscles: "Array<string (e.g., ['chest', 'triceps'])>",
    equipment: "Array<string (e.g., ['barbell'])>",
    difficulty: "'beginner' | 'intermediate' | 'advanced'",
    instructions: "Array<string>",
    setup: "Array<string>",
    execution: "Array<string>",
    breathing: "string",
    tempo: "string",
    commonMistakes: "Array<string>",
    safetyTips: "Array<string>",
    progressionTips: "Array<string>",
  };

  return `
    You are Atlas AI Coach, a fitness API. Your only job is to return a single, valid JSON object. Do not include any introductory text, explanations, summaries, or Markdown formatting.

    Generate a complete workout plan based on the user profile below.

    **User Profile:**
    - **Name:** ${profile.name}
    - **Primary Goal:** ${profile.goal}
    - **Custom Goal:** ${profile.customGoal || "None"}
    - **Experience Level:** ${profile.experience}
    - **Days per Week:** ${profile.daysPerWeek}
    - **Body Type:** ${profile.bodyType}
    - **Height:** ${profile.height} inches
    - **Weight:** ${profile.weight} lbs
    - **Available Equipment:** ${profile.equipment}

    **JSON Output Requirements:**
    The JSON object must have two top-level keys: "routines" and "exercises".

    1.  **"routines"**: An array of Routine objects. Each Routine object must have:
        - "id": A unique string ID for the routine (e.g., "day-1-upper-power").
        - "name": A descriptive name for the workout day (e.g., "Upper Body Power").
        - "exercises": An array of objects, each with:
            - "exerciseId": The ID of an exercise from the "exercises" list you are generating.
            - "targetSets": A number.
            - "targetReps": A string (e.g., "4-6" or "10-15").
            - "restSeconds": A number (e.g., 120).

    2.  **"exercises"**: An array of Exercise objects. This array must contain the full details for every single exercise mentioned in the "routines" array. Each Exercise object must conform exactly to the following TypeScript interface:
        \`\`\`json
        ${JSON.stringify(exerciseSchema, null, 2)}
        \`\`\`
  `;
}

export function GeneratingRoutineScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const sendCoachMessage = useAtlasStore((state) => state.sendCoachMessage);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const effectRan = useRef(false);

  useEffect(() => {
    if (profile && !effectRan.current) {
      const prompt = buildOnboardingPrompt(profile);
      sendCoachMessage(prompt, true).finally(() => {
        setActiveTab("dashboard");
      });
      effectRan.current = true;
    }
  }, [profile, sendCoachMessage, setActiveTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex min-h-[calc(100dvh-12rem)] items-center justify-center"
    >
      <Card className="flex w-full max-w-md flex-col items-center p-6 text-center">
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Bot size={48} className="text-emerald-300" />
        </motion.div>
        <h1 className="mt-4 text-2xl font-semibold text-white">Generating your plan...</h1>
        <p className="mt-2 text-zinc-400">
          Your new AI coach is analyzing your profile to create the optimal workout routine.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
          <Sparkles size={14} className="text-emerald-300" />
          <span>Using your personal AI provider</span>
        </div>
      </Card>
    </motion.div>
  );
}