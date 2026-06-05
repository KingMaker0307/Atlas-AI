"use client";

import { motion } from "framer-motion";
import { Bot, Send, User, Info, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { parseAiWorkoutPlan } from "@/lib/ai/parser";
import { useAtlasStore } from "@/store/useAtlasStore";
import { checkTopicRelevance } from "@/lib/coach/topic-guard";
import { createId } from "@/lib/id";

export function CoachScreen() {
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const sendCoachMessage = useAtlasStore((state) => state.sendCoachMessage);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const cancelCoach = () => useAtlasStore.setState({ coachBusy: false });
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const setEditingWorkoutPlanId = useAtlasStore((state) => state.setEditingWorkoutPlanId);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const apiCallCount = useAtlasStore((state) => state.apiCallCount);
  const tokenCount = useAtlasStore((state) => state.tokenCount);
  const guidedMode = useAtlasStore((state) => state.guidedMode);
  const selectedDate = useAtlasStore((state) => state.selectedDate);
  const setSelectedDate = useAtlasStore((state) => state.setSelectedDate);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const navigateDayOffset = (offset: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const nextStr = `${yyyy}-${mm}-${dd}`;
    const todayStr = new Date().toISOString().slice(0, 10);
    if (nextStr > todayStr) return;
    void setSelectedDate(nextStr);
  };

  const dateLabel = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (selectedDate === todayStr) return "Today";
    if (selectedDate === yesterdayStr) return "Yesterday";
    
    const d = new Date(selectedDate + "T12:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }, [selectedDate]);
  
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).coachPrompt) {
      const prompt = (window as any).coachPrompt;
      (window as any).coachPrompt = undefined;
      setDraft("");
      void sendCoachMessage(prompt);
    }
  }, []);

  // Define a placeholder quota limit for API calls
  const apiQuotaLimit = 20; // Based on your previous error message for gemini-2.5-flash

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const apiCallPercentage = (apiCallCount / apiQuotaLimit) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-[calc(100dvh-15rem)] md:h-[calc(100dvh-8rem)] flex-col gap-3"
    >
      <section className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm text-zinc-400">
            {guidedMode ? "Ask me anything about fitness 🏃" : "Intelligent guidance"}
          </p>
          <h1 className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-semibold tracking-normal text-foreground">Coach</h1>
        </div>

        {/* Date Selector Switcher */}
        <div className="flex items-center justify-between p-1 bg-input border border-input-border rounded-2xl select-none sm:w-auto w-full">
          <button
            onClick={() => navigateDayOffset(-1)}
            aria-label="Previous day"
            type="button"
            className="h-9 w-9 flex items-center justify-center rounded-xl transition hover:bg-white dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-300 active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="relative">
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  void setSelectedDate(e.target.value);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              aria-label="Select custom date"
            />
            <button
              type="button"
              className="h-9 px-3 gap-1.5 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-455 shadow-sm border border-input-border text-xs font-bold uppercase tracking-wider focus-visible:outline-none"
            >
              <Calendar size={13} aria-hidden="true" />
              <span>{dateLabel}</span>
            </button>
          </div>

          <button
            onClick={() => navigateDayOffset(1)}
            disabled={selectedDate === new Date().toISOString().slice(0, 10)}
            aria-label="Next day"
            type="button"
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-xl transition active:scale-95",
              selectedDate === new Date().toISOString().slice(0, 10)
                ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
                : "hover:bg-white dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-300"
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      <Surface className="p-3.5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 text-zinc-700 dark:text-zinc-300 rounded-xl flex gap-3 items-start select-none shrink-0">
        <Info size={16} className="text-emerald-600 dark:text-emerald-450 shrink-0 mt-0.5" />
        <p className="text-xs leading-normal">
          This is your private AI trainer. Ask questions like: <span className="text-zinc-900 dark:text-white font-bold">"How do I perform a dumbbell curl?"</span> or <span className="text-zinc-900 dark:text-white font-bold">"Give me a 10-minute warm-up"</span> for immediate guidance.
        </p>
      </Surface>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {aiMessages.filter((m) => m.role !== "system").length === 0 && (
              <div className="flex flex-col gap-2.5 pb-4 select-none">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Tap a question to start:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    guidedMode ? [
                      { text: "I'm new to the gym — where do I start? 🏋️", icon: "🏋️" },
                      { text: "What should I eat today? 🥗", icon: "🥗" },
                      { text: "I feel sore — should I still work out? 😅", icon: "😅" },
                    ] : [
                      { text: "Help me build a beginner 3-day workout plan", icon: "🏋️" },
                      { text: "Suggest a healthy, high-protein breakfast", icon: "🥗" },
                      { text: "Why is sleep important for exercise?", icon: "😴" },
                    ]
                  ).map((chip) => (
                    <button
                      key={chip.text}
                      type="button"
                      onClick={() => {
                        if (coachBusy) return;
                        void sendCoachMessage(chip.text);
                      }}
                      className="p-3 text-left rounded-xl border border-zinc-250 hover:border-emerald-500/40 bg-zinc-50/50 hover:bg-emerald-500/[0.02] dark:border-zinc-800 dark:hover:border-emerald-500/25 dark:bg-zinc-900/45 dark:hover:bg-emerald-500/[0.01] text-xs font-semibold text-zinc-905 dark:text-zinc-150 transition active:scale-[0.98] flex flex-col justify-between h-20"
                    >
                      <span className="text-lg">{chip.icon}</span>
                      <span className="leading-snug">{chip.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {aiMessages.filter((m) => m.role !== "system").map((message) => {
              const isWorkoutPlan = parseAiWorkoutPlan(message.content) !== null;

              return (
                <div
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  key={message.id}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      message.role === "user" ? "bg-white/10" : "bg-emerald-300 text-zinc-950"
                    }`}
                  >
                    {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <Surface
                    className={`max-w-[85%] p-3 text-sm ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-white/10"
                        : "rounded-tl-sm border-emerald-300/20 bg-emerald-300/5"
                    }`}
                  >
                    {isWorkoutPlan ? (
                      <div className="space-y-3">
                        {(() => {
                          // Extract non-json text warning if present
                          let nonJson = message.content;
                          const jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/);
                          if (jsonMatch) {
                            nonJson = message.content.replace(jsonMatch[0], "").trim();
                          } else if (message.content.trim().startsWith("{")) {
                            nonJson = "";
                          }
                          return nonJson ? (
                            <ReactMarkdown
                              className="prose dark:prose-invert prose-p:leading-relaxed prose-a:text-emerald-600 dark:prose-a:text-emerald-300 max-w-none text-xs"
                            >
                              {nonJson}
                            </ReactMarkdown>
                          ) : null;
                        })()}
                        <div className="border-t border-emerald-300/10 pt-3">
                          <p className="font-medium text-emerald-250 dark:text-emerald-200 mb-2">
                            I've generated a new workout plan for you.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              const plan = parseAiWorkoutPlan(message.content);
                              if (plan) {
                                setEditingWorkoutPlanId(plan.id);
                                setActiveSubScreen("workout-plan-detail");
                              }
                              setActiveTab("workout");
                            }}
                          >
                            View Plan Details
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ReactMarkdown
                        className="prose dark:prose-invert prose-p:leading-relaxed prose-a:text-emerald-600 dark:prose-a:text-emerald-300 prose-pre:bg-zinc-100 dark:prose-pre:bg-black/50 max-w-none"
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </Surface>
                </div>
              );
            })}
            {coachBusy ? (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-zinc-950">
                  <Bot size={16} />
                </div>
                <div className="space-y-1.5 max-w-[85%]">
                  <Surface className="rounded-tl-sm border-emerald-300/20 bg-emerald-300/5 p-3">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300/50" />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300/50"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300/50"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </Surface>
                  <p className="text-[10px] text-zinc-500 italic px-1 animate-pulse">
                    Hang tight! Something awesome is cooking from your AI Coach...
                  </p>
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        </div>
        <div className="shrink-0 border-t border-card-border p-3">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = draft.trim();
              if (!trimmed || coachBusy) return;
              
              const guardResult = checkTopicRelevance(trimmed);
              if (!guardResult.allowed) {
                const userMessage = {
                  id: createId("user"),
                  role: "user" as const,
                  content: trimmed,
                  createdAt: new Date().toISOString(),
                };
                const blockMessage = {
                  id: createId("assistant"),
                  role: "assistant" as const,
                  content: `🚫 ${guardResult.reason}`,
                  createdAt: new Date().toISOString(),
                };
                useAtlasStore.setState((state) => ({
                  aiMessages: [...state.aiMessages, userMessage, blockMessage],
                }));
                setDraft("");
                return;
              }

              void sendCoachMessage(trimmed);
              setDraft("");
            }}
          >
            <input
              className="flex-1 rounded-xl border border-input-border bg-input px-4 py-2.5 md:py-2 text-base md:text-sm text-foreground placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-0"
              placeholder={coachBusy ? "Waiting for AI response..." : guidedMode ? "Ask anything — no question is too basic! 😊" : "Ask about your routine, fatigue, or nutrition..."}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={coachBusy}
            />
            {coachBusy ? (
              <Button
                type="button"
                aria-label="Cancel AI response"
                className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white"
                size="icon"
                onClick={cancelCoach}
              >
                <X size={18} />
              </Button>
            ) : (
              <Button
                className="shrink-0"
                size="icon"
                aria-label="Send message"
                variant={draft.trim() ? "primary" : "secondary"}
                disabled={!draft.trim() || coachBusy}
                type="submit"
              >
                <Send size={18} />
              </Button>
            )}
          </form>
        </div>
      </Card>

      {/* AI Usage Meter — hidden in Guided Mode, shown in Expert Mode */}
      {!guidedMode && (
        <Card className="p-3 sm:p-4 mt-3 sm:mt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground">AI Usage</h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Calls: {apiCallCount}/{apiQuotaLimit} · Tokens: {tokenCount.toLocaleString()}</p>
            </div>
            <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(apiCallPercentage, 100)}%` }} />
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
}