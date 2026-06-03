"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Loader2, Cpu, ArrowRight, AlertTriangle, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAtlasStore } from "@/store/useAtlasStore";
import { getProviderAdapter } from "@/providers";
import { decryptString } from "@/lib/security/crypto";
import { createId } from "@/lib/id";
import type { NutritionEntry } from "@/types/domain";

type TimeRange = "Today" | "Last 3 Days" | "Last Week" | "Last Month" | "All Time";

const RANGES: TimeRange[] = ["Today", "Last 3 Days", "Last Week", "Last Month", "All Time"];

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
    else return nutritionEntries; // All Time

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

    try {
      const isLocal = activeProvider.type === "ollama" || activeProvider.type === "lmstudio";
      const apiKey = isLocal ? "" : await decryptString(activeProvider.apiKey!);
      const adapter = getProviderAdapter(activeProvider.type);

      const formattedLogs = filteredEntries
        .map((e) => {
          const dateStr = e.timestamp.slice(0, 10);
          return `- ${dateStr}: ${e.name} (${e.calories} kcal, P: ${e.protein}g, C: ${e.carbs}g, F: ${e.fat}g)`;
        })
        .join("\n");

      const prompt = `You are a sports nutritionist and clinical dietitian.
Analyze the athlete's nutrition logs for the chosen range: ${selectedRange}.
Dietary Style: ${profile?.dietaryPreferences || "Not specified"}
Foods / Allergies to Avoid: ${avoidInput || "None specified"}

Provide 2-3 specific, highly actionable nutrition tips. Focus on:
- What they are lacking or doing well based on macro/micro logs.
- Safe food suggestions matching their dietary style (${profile?.dietaryPreferences || "Not specified"}) while strictly avoiding ${avoidInput || "None specified"}.
- One specific next step.

CRITICAL WARNING: If the user listed any food allergies/avoids (${avoidInput || "None"}), you MUST ensure no suggested food contains those ingredients.
Always include a brief disclaimer at the end: "Consult a healthcare professional for clinical advice."

Keep it under 150 words. Format with markdown bullet points. Do not include introductory conversational filler.

Nutrition logs:
${formattedLogs || "No foods logged in this period."}
`;

      const { content, tokenCount } = await adapter.chat({
        provider: activeProvider,
        apiKey,
        messages: [{ id: createId("user"), role: "user", content: prompt, createdAt: new Date().toISOString() }],
        systemContext: "You are a clinical sports dietitian.",
      });

      const cleanedContent = content.trim();
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
      <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-card-border space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="text-zinc-400" size={17} />
          <h4 className="text-xs font-bold text-foreground">AI Nutrition Insights</h4>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Connect an AI provider in Settings to unlock deep nutritional habits analysis, pattern tracking, and customized meal feedback.
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
    <div className="p-5 rounded-3xl bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] border border-emerald-500/10 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={17} />
          <h4 className="text-xs font-bold text-foreground">AI Nutrition Coach</h4>
        </div>
        {activeProvider && (
          <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
            via {activeProvider.label}
          </span>
        )}
      </div>

      {/* ── Standardized Medical Warning Box ── */}
      <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 flex items-start gap-2.5 text-rose-600 dark:text-rose-455">
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
        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
          Allergies / Foods to Avoid
        </label>
        <input
          type="text"
          value={avoidInput}
          onChange={(e) => setAvoidInput(e.target.value)}
          placeholder="e.g. peanuts, dairy, gluten, shellfish"
          className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-card-border bg-input text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
        />
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
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
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
            <Loader2 className="animate-spin text-emerald-500" size={20} />
            <p className="text-[10px] text-zinc-500 font-bold">Analyzing nutrition logs...</p>
          </div>
        ) : error ? (
          <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-500 font-semibold leading-relaxed">
            {error}
          </div>
        ) : currentTip ? (
          <div className="prose dark:prose-invert prose-p:leading-relaxed prose-li:my-0.5 max-w-none text-[11px] text-zinc-650 dark:text-zinc-350">
            <ReactMarkdown>{currentTip}</ReactMarkdown>
          </div>
        ) : (
          <div className="py-2 flex flex-col items-center justify-center gap-3">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center max-w-[280px]">
              Ready to analyze {filteredEntries.length} logged food item{filteredEntries.length === 1 ? "" : "s"} for the chosen range.
            </p>
            <button
              onClick={generateTip}
              className="flex items-center justify-center gap-2 w-full max-w-[180px] py-2.5 rounded-xl bg-emerald-650 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-sm min-h-[40px] transition-all"
            >
              Generate AI Nutrition Tip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
