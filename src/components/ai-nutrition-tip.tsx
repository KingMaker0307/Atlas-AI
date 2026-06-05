"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Sparkles, Loader2, Cpu, ArrowRight, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAtlasStore } from "@/store/useAtlasStore";
import { getProviderAdapter } from "@/providers";
import { decryptString } from "@/lib/security/crypto";
import { createId } from "@/lib/id";
import type { NutritionEntry } from "@/types/domain";
import { checkTopicRelevance } from "@/lib/coach/topic-guard";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

const getPreviousDateString = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

type TimeRange = "Today" | "Last 3 Days" | "Last Week" | "Last Month";

const RANGES: TimeRange[] = ["Today", "Last 3 Days", "Last Week", "Last Month"];

export function AiNutritionTip() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("Last Week");
  const [avoidInput, setAvoidInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nutritionEntries = useAtlasStore((s) => s.nutritionEntries || []);
  const profile = useAtlasStore((s) => s.profile);
  const aiProviders = useAtlasStore((s) => s.aiProviders);
  const activeProviderId = useAtlasStore((s) => s.activeProviderId);
  const setActiveTab = useAtlasStore((s) => s.setActiveTab);
  const setActiveSettingsTab = useAtlasStore((s) => s.setActiveSettingsTab);
  const aiNutritionTipsCache = useAtlasStore((s) => s.aiNutritionTipsCache || {});
  const setAiNutritionTipCache = useAtlasStore((s) => s.setAiNutritionTipCache);
  const selectedDate = useAtlasStore((s) => s.selectedDate);
  const user = useAtlasStore((s) => s.user);

  useEffect(() => {
    const checkCache = async () => {
      if (!user?.id) return;
      const { registry } = await import("@/lib/repositories/registry");
      const cacheKey = `nutrition:${selectedDate}:${selectedRange}:${avoidInput.trim().toLowerCase()}`;
      const cached = await registry.load((r, uid) => r.aiCache.getCachedResponse(uid, "daily_insight", cacheKey));
      if (cached) {
        setAiNutritionTipCache(selectedRange, cached as string);
      } else {
        setAiNutritionTipCache(selectedRange, "");
      }
    };
    checkCache();
  }, [selectedDate, selectedRange, avoidInput, user?.id]);

  const activeProvider = useMemo(() => {
    return aiProviders.find((p) => p.id === activeProviderId && p.enabled);
  }, [aiProviders, activeProviderId]);

  const hasAiConfigured = useMemo(() => {
    if (!activeProvider) return false;
    const isLocal = activeProvider.type === "ollama" || activeProvider.type === "lmstudio";
    return isLocal || !!activeProvider.apiKey;
  }, [activeProvider]);

  // Filter logs for chosen range
  const filteredEntries = useMemo(() => {
    if (nutritionEntries.length === 0) return [];

    const now = Date.now();
    let days = 0;
    if (selectedRange === "Today") days = 0;
    else if (selectedRange === "Last 3 Days") days = 3;
    else if (selectedRange === "Last Week") days = 7;
    else if (selectedRange === "Last Month") days = 30;

    const limitTime = now - days * 24 * 60 * 60 * 1000;
    const targetDateStr = new Date().toISOString().slice(0, 10);

    return nutritionEntries.filter((e) => {
      const entryTime = new Date(e.timestamp).getTime();
      if (selectedRange === "Today") {
        return e.timestamp.slice(0, 10) === targetDateStr;
      }
      return entryTime >= limitTime;
    });
  }, [nutritionEntries, selectedRange]);

  const generateTip = async () => {
    if (!activeProvider) return;
    setLoading(true);
    setError(null);

    if (avoidInput.trim()) {
      const guardResult = checkTopicRelevance(avoidInput);
      if (!guardResult.allowed) {
        setError(`🚫 ${guardResult.reason}`);
        setLoading(false);
        return;
      }
    }

    try {
      // Check cache first to avoid calling AI for the same day and range
      if (user?.id) {
        const { registry } = await import("@/lib/repositories/registry");
        const cacheKey = `nutrition:${selectedDate}:${selectedRange}:${avoidInput.trim().toLowerCase()}`;
        const cached = await registry.load((r, uid) => r.aiCache.getCachedResponse(uid, "daily_insight", cacheKey));
        if (cached) {
          setAiNutritionTipCache(selectedRange, cached as string);
          setLoading(false);
          return;
        }
      }

      const isLocal = activeProvider.type === "ollama" || activeProvider.type === "lmstudio";
      const apiKey = isLocal ? "" : await decryptString(activeProvider.apiKey!);
      const adapter = getProviderAdapter(activeProvider.type);

      const formattedLogs = filteredEntries
        .map((e) => {
          const dateStr = e.timestamp.slice(0, 10);
          return `- ${dateStr}: ${e.name} (${e.calories} kcal, P: ${e.protein}g, C: ${e.carbs}g, F: ${e.fat}g)`;
        })
        .join("\n");

      // Fetch previous day's cached insight to provide continuity
      let previousDayInsight = "";
      if (user?.id) {
        const { registry } = await import("@/lib/repositories/registry");
        const prevDate = getPreviousDateString(selectedDate);
        const prevCacheKey = `nutrition:${prevDate}:${selectedRange}:${avoidInput.trim().toLowerCase()}`;
        const prevCached = await registry.load((r, uid) => r.aiCache.getCachedResponse(uid, "daily_insight", prevCacheKey));
        if (prevCached) previousDayInsight = prevCached as string;
      }

      const previousInsightBlock = previousDayInsight
        ? `\n\nPrevious Day's Nutrition Insight (use this as context to build upon — do NOT repeat it, instead advance the advice and track progress):\n${previousDayInsight}`
        : "";

      const prompt = `You are a sports nutritionist and clinical dietitian.
Analyze the athlete's nutrition logs for the chosen range: ${selectedRange}.
Dietary Style: ${profile?.dietaryPreferences || "Not specified"}
Foods / Allergies to Avoid: ${avoidInput || "None specified"}

Provide 2-3 mindful, highly actionable, and genuine nutrition recommendations. Focus on:
- A constructive critique of their actual calorie and macro intake relative to their fitness goals.
- Specific food suggestions or adjustments matching their dietary style (${profile?.dietaryPreferences || "Not specified"}) while strictly respecting their allergy constraints (${avoidInput || "none"}).
- A concrete, helpful action plan for today.

IMPORTANT: Your response must be specific to THIS athlete's actual logged food data. Do not give generic advice. Reference their actual meals, calorie counts, and macro ratios. Be encouraging but honest. Every recommendation must be actionable and grounded in their logged intake.

CRITICAL WARNING: If the user listed any food allergies/avoids (${avoidInput || "None"}), you MUST ensure no suggested food contains those ingredients.
Always include a brief disclaimer at the end: "Consult a healthcare professional for clinical advice."

Format with clean markdown bullet points, keeping it under 150 words. Be direct, mindful, and avoid generic filler.

Nutrition logs:
${formattedLogs || "No foods logged in this period."}${previousInsightBlock}
`;

      const { content, tokenCount } = await adapter.chat({
        provider: activeProvider,
        apiKey,
        messages: [{ id: createId("user"), role: "user", content: prompt, createdAt: new Date().toISOString() }],
        systemContext: "You are a clinical sports dietitian.",
      });

      const cleanedContent = content.trim();

      // Save to db cache
      if (user?.id) {
        const { registry } = await import("@/lib/repositories/registry");
        const cacheKey = `nutrition:${selectedDate}:${selectedRange}:${avoidInput.trim().toLowerCase()}`;
        registry.save((r, uid) => r.aiCache.saveResponse(uid, "daily_insight", cacheKey, cleanedContent));
      }

      setAiNutritionTipCache(selectedRange, cleanedContent);

      // Update store counters
      useAtlasStore.setState((state) => ({
        apiCallCount: state.apiCallCount + 1,
        tokenCount: state.tokenCount + (tokenCount ?? 0),
      }));
    } catch (err: any) {
      console.error("AI Nutrition query failed:", err);
      setError(err?.message || "Failed to query the AI provider. Please verify your connection/API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSettings = () => {
    setActiveTab("settings");
    setActiveSettingsTab("ai");
  };

  const currentTip = aiNutritionTipsCache[selectedRange];

  if (!hasAiConfigured) {
    return (
      <Card className="p-4 space-y-3 border-card-border">
        <div className="flex items-center gap-2">
          <Cpu className="text-zinc-400" size={16} />
          <h4 className="text-xs font-bold text-zinc-955">AI Nutrition Insights</h4>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
          Connect an AI provider in Settings to unlock deep nutritional habits analysis, pattern tracking, and customized meal feedback.
        </p>
        <button
          onClick={handleGoToSettings}
          className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-500 hover:text-emerald-600 transition-colors min-h-[40px]"
        >
          Configure AI Provider <ArrowRight size={12} />
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-5 shadow-md border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.04] via-teal-500/[0.02] to-transparent dark:from-emerald-500/[0.03] dark:via-teal-500/[0.01]">
      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
            <Sparkles className="text-white" size={14} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-foreground tracking-tight">AI Nutrition Coach</h4>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Personalised meal insights</p>
          </div>
        </div>
        {activeProvider && (
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
            via {activeProvider.label}
          </span>
        )}
      </div>

      {/* ── Standardized Medical Warning Box ── */}
      <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/15 flex items-start gap-2.5 text-rose-600 dark:text-rose-455">
        <ShieldAlert size={16} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider">Allergy &amp; Medical Disclaimer</p>
          <p className="text-[10px] leading-relaxed font-semibold opacity-90">
            These suggestions are AI-generated tips and do not constitute clinical guidance. Always verify ingredients independently and consult a doctor or registered dietitian if you have food allergies, intolerances, or medical conditions. Do not rely solely on AI suggestions.
          </p>
        </div>
      </div>

      {/* Avoid Input Control */}
      <div className="space-y-1.5">
        <Label>Allergies / Foods to Avoid</Label>
        <Input
          type="text"
          value={avoidInput}
          onChange={(e) => setAvoidInput(e.target.value)}
          placeholder="e.g. peanuts, dairy, gluten, shellfish"
          className="min-h-[40px]"
        />
      </div>

      {/* Standardized range selectors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        {RANGES.map((r) => {
          const isSelected = selectedRange === r;
          return (
            <button
              key={r}
              onClick={() => {
                setSelectedRange(r);
                setError(null);
              }}
              className={`h-9 px-4 rounded-xl border text-[11px] font-extrabold flex items-center justify-center transition-all min-h-[36px] whitespace-nowrap tracking-wide ${
                isSelected
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-surface border-surface-border text-zinc-500 hover:text-zinc-800 hover:border-emerald-500/40 dark:text-zinc-400 dark:hover:text-zinc-200"
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
          <div className="py-8 flex flex-col items-center justify-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-emerald-500" size={20} />
            </div>
            <p className="text-xs text-zinc-500 font-bold tracking-wide">Analyzing nutrition logs...</p>
          </div>
        ) : error ? (
          <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-500 font-semibold leading-relaxed">
            {error}
          </div>
        ) : currentTip ? (
          <div className="rounded-xl bg-surface/50 border border-surface-border p-4">
            <ReactMarkdown className="prose dark:prose-invert prose-p:leading-relaxed prose-a:text-emerald-600 dark:prose-a:text-emerald-300 prose-strong:text-foreground max-w-none text-[13px] text-zinc-700 dark:text-zinc-300 font-medium">
              {currentTip}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center gap-4">
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 text-center max-w-[280px] font-semibold leading-relaxed">
              {filteredEntries.length === 0
                ? "No foods logged in this period. Log your meals to unlock personalised insights."
                : `Ready to analyze ${filteredEntries.length} logged food item${filteredEntries.length === 1 ? "" : "s"} for the chosen range.`}
            </p>
            {filteredEntries.length > 0 && (
              <button
                onClick={generateTip}
                className="group flex items-center justify-center gap-2.5 w-full max-w-[220px] py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[13px] font-extrabold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 min-h-[44px] transition-all active:scale-[0.97] tracking-wide"
              >
                <Sparkles size={15} className="group-hover:animate-pulse" />
                Generate Nutrition Insight
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
