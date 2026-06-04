"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Loader2, Cpu, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAtlasStore } from "@/store/useAtlasStore";
import { getProviderAdapter } from "@/providers";
import { decryptString } from "@/lib/security/crypto";
import { getExerciseById as getStaticExerciseById } from "@/data/exercises";
import { createId } from "@/lib/id";
import type { Workout } from "@/types/domain";

type TimeRange =
  | "Last Week"
  | "1 Month"
  | "3 Months"
  | "1 Year";

const RANGES: TimeRange[] = [
  "Last Week",
  "1 Month",
  "3 Months",
  "1 Year",
];

export function AiWorkoutTip() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("Last Week");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const workouts = useAtlasStore((s) => s.workouts);
  const profile = useAtlasStore((s) => s.profile);
  const aiProviders = useAtlasStore((s) => s.aiProviders);
  const activeProviderId = useAtlasStore((s) => s.activeProviderId);
  const storeExercises = useAtlasStore((s) => s.exercises || []);
  const setActiveTab = useAtlasStore((s) => s.setActiveTab);
  const setActiveSettingsTab = useAtlasStore((s) => s.setActiveSettingsTab);
  const aiWorkoutTipsCache = useAtlasStore((s) => s.aiWorkoutTipsCache);
  const setAiWorkoutTipCache = useAtlasStore((s) => s.setAiWorkoutTipCache);

  const getExerciseById = (id: string) => {
    const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return (
      storeExercises.find((e) => {
        const eNorm = e.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return e.id === id || eNorm === normId || e.name.trim().toLowerCase() === id.trim().toLowerCase();
      }) || getStaticExerciseById(id)
    );
  };

  const activeProvider = useMemo(() => {
    return aiProviders.find((p) => p.id === activeProviderId && p.enabled);
  }, [aiProviders, activeProviderId]);

  const hasAiConfigured = useMemo(() => {
    if (!activeProvider) return false;
    const isLocal = activeProvider.type === "ollama" || activeProvider.type === "lmstudio";
    return isLocal || !!activeProvider.apiKey;
  }, [activeProvider]);

  // Filter and format workouts for AI context
  const filteredWorkouts = useMemo(() => {
    const completed = workouts.filter((w) =>
      w.exercises.some((ex) => ex.sets.some((s) => s.completed))
    );
    if (completed.length === 0) return [];

    const now = Date.now();
    let days = 0;
    if (selectedRange === "Last Week") days = 7;
    else if (selectedRange === "1 Month") days = 30;
    else if (selectedRange === "3 Months") days = 90;
    else if (selectedRange === "1 Year") days = 365;
    else return completed;

    const limitTime = now - days * 24 * 60 * 60 * 1000;
    return completed.filter((w) => new Date(w.startedAt).getTime() >= limitTime);
  }, [workouts, selectedRange]);

  const generateTip = async () => {
    if (!activeProvider) return;
    setLoading(true);
    setError(null);

    try {
      const isLocal = activeProvider.type === "ollama" || activeProvider.type === "lmstudio";
      const apiKey = isLocal ? "" : await decryptString(activeProvider.apiKey!);
      const adapter = getProviderAdapter(activeProvider.type);

      const workoutsFormatted = filteredWorkouts
        .map((w) => {
          const dateStr = w.startedAt.slice(0, 10);
          const exercisesStr = w.exercises
            .map((ex) => {
              const name = getExerciseById(ex.exerciseId)?.name || ex.exerciseId;
              const completedSets = ex.sets.filter((s) => s.completed);
              const setsStr = completedSets
                .map(
                  (s, idx) =>
                    `Set ${idx + 1}: ${s.weight} ${profile?.weightUnit || "kg"} x ${s.reps} reps${
                      s.rir !== undefined ? ` (RIR: ${s.rir})` : ""
                    }`
                )
                .join(", ");
              return `- ${name}: ${setsStr}`;
            })
            .join("\n");
          return `Workout: ${w.name} on ${dateStr}\n${exercisesStr}`;
        })
        .join("\n\n");

      const prompt = `You are Atlas Biomechanics Coach, a clinical-grade sports physiotherapist and strength coach.
Based on the following ${selectedRange} of training data, provide a proper improvement analysis and specific, highly actionable training recommendations.
Analyze the logged exercises, sets, reps, and weights to identify:
1. Progression & Performance: Highlight specific lifts that are progressing well or areas of solid consistency.
2. Areas for Improvement: Identify any volume imbalances, potential overtraining of specific muscles, or recovery/fatigue needs based on RIR (Reps in Reserve) if provided.
3. Actionable Next Step: Give exactly one clear, simple directive for the athlete's next workout.

Format the output cleanly in markdown with short bullet points. Keep the response simple, direct, and under 150 words. Do not use generic filler. Go straight to the points.

Athlete Profile:
- Goal: ${profile?.goal || "Not specified"} (Training Style: ${profile?.trainingStyle || "Not specified"}, Experience: ${profile?.experience || "beginner"})
- Target Days/Week: ${profile?.daysPerWeek || 3}
- Weight: ${profile?.weight ? `${profile.weight} ${profile.weightUnit}` : "Not specified"}

Training Volume Data for ${selectedRange}:
${workoutsFormatted || "No workouts logged in this period."}
`;

      const { content, tokenCount } = await adapter.chat({
        provider: activeProvider,
        apiKey,
        messages: [{ id: createId("user"), role: "user", content: prompt, createdAt: new Date().toISOString() }],
        systemContext: "You are Atlas Biomechanics Coach.",
      });

      const cleanedContent = content.trim();
      setAiWorkoutTipCache(selectedRange, cleanedContent);

      // Update store counters
      useAtlasStore.setState((state) => ({
        apiCallCount: state.apiCallCount + 1,
        tokenCount: state.tokenCount + (tokenCount ?? 0),
      }));
    } catch (err: any) {
      console.error("AI Coach query failed:", err);
      setError(err?.message || "Failed to query the AI provider. Please verify your connection/API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSettings = () => {
    setActiveTab("settings");
    setActiveSettingsTab("ai");
  };

  const currentTip = aiWorkoutTipsCache[selectedRange];

  if (!hasAiConfigured) {
    return (
      <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-card-border space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="text-zinc-400" size={17} />
          <h4 className="text-xs font-bold text-foreground">AI Coaching Insights</h4>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Connect an AI provider in Settings to unlock deep analytical insights, pattern detection, and personalized progression feedback based on your workout history.
        </p>
        <button
          onClick={handleGoToSettings}
          className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors min-h-[40px]"
        >
          Configure AI Provider <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-3xl bg-violet-500/[0.03] dark:bg-violet-500/[0.02] border border-violet-500/10 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-500" size={17} />
          <h4 className="text-xs font-bold text-foreground">AI Workout Analysis</h4>
        </div>
        {activeProvider && (
          <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
            via {activeProvider.label} ({activeProvider.model})
          </span>
        )}
      </div>

      {/* Standardized range selectors */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        {RANGES.map((r) => {
          const isSelected = selectedRange === r;
          return (
            <button
              key={r}
              onClick={() => {
                setSelectedRange(r);
                setError(null);
              }}
              className={`text-[9px] font-bold px-3 py-2 rounded-lg border whitespace-nowrap min-h-[40px] flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-violet-500 border-violet-500 text-white shadow-sm"
                  : "bg-surface border-surface-border text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Action / Result container */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-violet-500" size={20} />
            <p className="text-[10px] text-zinc-500 font-bold">Analyzing workout history...</p>
          </div>
        ) : error ? (
          <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-500 font-semibold leading-relaxed">
            {error}
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="py-4 flex flex-col items-center justify-center gap-1.5 text-center">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-[285px] leading-relaxed">
              No workouts logged in this period. Log your workouts to unlock personalized AI analysis for this timeframe.
            </p>
          </div>
        ) : currentTip ? (
          <div className="prose dark:prose-invert prose-p:leading-relaxed prose-li:my-0.5 max-w-none text-[11px] text-zinc-600 dark:text-zinc-350">
            <ReactMarkdown>{currentTip}</ReactMarkdown>
          </div>
        ) : (
          <div className="py-2 flex flex-col items-center justify-center gap-3">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center max-w-[280px]">
              Ready to analyze {filteredWorkouts.length} session{filteredWorkouts.length === 1 ? "" : "s"} for the chosen range.
            </p>
            <button
              onClick={generateTip}
              className="flex items-center justify-center gap-2 w-full max-w-[180px] py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold shadow-sm min-h-[40px] transition-all"
            >
              Generate AI Coach Tip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
