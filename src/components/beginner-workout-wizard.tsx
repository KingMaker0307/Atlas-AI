"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Sparkles, Dumbbell, Home, Activity } from "lucide-react";

type Goal = "lose_weight" | "build_muscle" | "get_healthier";
type Days = 2 | 3 | 4 | 5;
type Equipment = "full gym" | "home gym" | "bodyweight";

interface BeginnerWorkoutWizardProps {
  onComplete: () => void;
}

const GOALS: { value: Goal; emoji: string; label: string; desc: string }[] = [
  { value: "lose_weight",    emoji: "🔥", label: "Lose weight",    desc: "Burn fat and feel lighter" },
  { value: "build_muscle",   emoji: "💪", label: "Build muscle",   desc: "Get stronger and more toned" },
  { value: "get_healthier",  emoji: "❤️", label: "Get healthier",  desc: "Feel better and have more energy" },
];

const DAY_OPTIONS: { value: Days; label: string; desc: string }[] = [
  { value: 2, label: "2 days", desc: "Great starter pace" },
  { value: 3, label: "3 days", desc: "Most popular for beginners" },
  { value: 4, label: "4 days", desc: "Good if you have the time" },
  { value: 5, label: "5 days", desc: "For the highly motivated" },
];

const EQUIPMENT_OPTIONS: { value: Equipment; emoji: string; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "full gym",   emoji: "🏋️", label: "Full gym",       desc: "Access to machines and weights", icon: Dumbbell },
  { value: "home gym",   emoji: "🏠", label: "Home / basic",   desc: "Dumbbells or resistance bands",  icon: Home },
  { value: "bodyweight", emoji: "🤸", label: "No equipment",   desc: "Just my body",                  icon: Activity },
];

export function BeginnerWorkoutWizard({ onComplete }: BeginnerWorkoutWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [days, setDays] = useState<Days | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const sendCoachMessage = useAtlasStore((s) => s.sendCoachMessage);
  const profile = useAtlasStore((s) => s.profile);

  const handleGenerate = async () => {
    if (!goal || !days || !equipment) return;
    setIsGenerating(true);
    try {
      const goalText =
        goal === "lose_weight"   ? "Lose weight and burn fat" :
        goal === "build_muscle"  ? "Build muscle and get stronger" :
                                   "Improve overall health and fitness";

      const style =
        goal === "build_muscle" ? "hypertrophy" :
        goal === "lose_weight"  ? "endurance" :
                                  "general";

      const prompt = `Generate a complete ${days}-day per week beginner workout plan for someone who wants to "${goalText}". Equipment: ${equipment}. Training style: ${style}. Duration per session: ${profile?.workoutDuration ?? 45} minutes. Experience: beginner. Keep all exercise names simple and beginner-friendly.`;

      await sendCoachMessage(prompt, { isRoutineGeneration: true, startDay: "Monday" });
      onComplete();
    } catch {
      onComplete();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <Sparkles size={22} className="text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Let's build your plan</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Answer 3 quick questions — we'll create your first workout plan instantly
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "w-8 bg-emerald-500" : s < step ? "w-4 bg-emerald-500/50" : "w-4 bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 — Goal */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-foreground text-center">What's your main goal?</p>
            <div className="space-y-2.5">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => { setGoal(g.value); setStep(2); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                    goal === g.value
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-card-border bg-card hover:border-emerald-500/40"
                  }`}
                >
                  <span className="text-2xl shrink-0" aria-hidden="true">{g.emoji}</span>
                  <div>
                    <p className="font-bold text-sm text-foreground">{g.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{g.desc}</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto text-zinc-400 shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2 — Days */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-foreground text-center">How many days per week can you train?</p>
            <div className="grid grid-cols-2 gap-2.5">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => { setDays(d.value); setStep(3); }}
                  className={`flex flex-col items-center gap-1 p-4 rounded-2xl border text-center transition-all duration-150 cursor-pointer ${
                    days === d.value
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-card-border bg-card hover:border-emerald-500/40"
                  }`}
                >
                  <span className="text-2xl font-extrabold text-foreground">{d.value}</span>
                  <span className="text-xs font-bold text-zinc-500">{d.desc}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mx-auto cursor-pointer transition-colors">
              <ArrowLeft size={12} /> Back
            </button>
          </motion.div>
        )}

        {/* Step 3 — Equipment */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-foreground text-center">Where will you be working out?</p>
            <div className="space-y-2.5">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq.value}
                  type="button"
                  onClick={() => setEquipment(eq.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                    equipment === eq.value
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-card-border bg-card hover:border-emerald-500/40"
                  }`}
                >
                  <span className="text-2xl shrink-0" aria-hidden="true">{eq.emoji}</span>
                  <div>
                    <p className="font-bold text-sm text-foreground">{eq.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{eq.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer transition-colors">
                <ArrowLeft size={12} /> Back
              </button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!equipment || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Building your plan…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} />
                    Build my plan!
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
