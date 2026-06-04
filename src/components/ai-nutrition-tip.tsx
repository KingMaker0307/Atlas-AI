"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Loader2, Cpu, ArrowRight, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAtlasStore } from "@/store/useAtlasStore";
import { getProviderAdapter } from "@/providers";
import { decryptString } from "@/lib/security/crypto";
import { createId } from "@/lib/id";
import type { NutritionEntry } from "@/types/domain";
import { checkTopicRelevance } from "@/lib/coach/topic-guard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

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
    <Card className="p-4 space-y-4 shadow-sm border-emerald-500/15 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]">
      <div className="flex items-center justify-between gap-2 border-b border-card-border pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={15} />
          <h4 className="text-xs font-bold text-zinc-955">AI Nutrition Coach</h4>
        </div>
        {activeProvider && (
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
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
              className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center transition-all min-h-[36px] whitespace-nowrap ${
                isSelected
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-surface border-surface-border text-zinc-555 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
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
            <p className="text-xs text-zinc-500 font-bold">Analyzing nutrition logs...</p>
          </div>
        ) : error ? (
          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-500 font-semibold leading-relaxed">
            {error}
          </div>
        ) : currentTip ? (
          <ReactMarkdown className="prose dark:prose-invert prose-p:leading-relaxed prose-a:text-emerald-600 dark:prose-a:text-emerald-300 max-w-none text-xs text-zinc-700 dark:text-zinc-300 font-medium">
            {currentTip}
          </ReactMarkdown>
        ) : (
          <div className="py-2 flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center max-w-[280px] font-semibold leading-relaxed">
              Ready to analyze {filteredEntries.length} logged food item{filteredEntries.length === 1 ? "" : "s"} for the chosen range.
            </p>
            <Button
              onClick={generateTip}
              variant="primary"
              className="w-full max-w-[200px] text-xs font-bold"
            >
              Generate AI Nutrition Tip
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
