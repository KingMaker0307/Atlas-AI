"use client";

import { motion } from "framer-motion";
import { Bot, Send, User, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { parseAiWorkoutPlan } from "@/lib/ai/parser";
import { useAtlasStore } from "@/store/useAtlasStore";

export function CoachScreen() {
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const sendCoachMessage = useAtlasStore((state) => state.sendCoachMessage);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const setEditingWorkoutPlanId = useAtlasStore((state) => state.setEditingWorkoutPlanId);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const apiCallCount = useAtlasStore((state) => state.apiCallCount);
  const tokenCount = useAtlasStore((state) => state.tokenCount);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  
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
      <section className="shrink-0">
        <p className="text-xs sm:text-sm text-zinc-400">Intelligent guidance</p>
        <h1 className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-semibold tracking-normal text-foreground">Coach</h1>
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
              if (!draft.trim() || coachBusy) return;
              void sendCoachMessage(draft);
              setDraft("");
            }}
          >
            <input
              className="flex-1 rounded-xl border border-input-border bg-input px-4 py-2.5 md:py-2 text-base md:text-sm text-foreground placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-0"
              placeholder="Ask about your routine, fatigue, or nutrition..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={coachBusy}
            />
            <Button
              className="shrink-0"
              size="icon"
              variant={draft.trim() ? "primary" : "secondary"}
              disabled={!draft.trim() || coachBusy}
              type="submit"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </Card>

      {/* AI Usage Meter */}
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
    </motion.div>
  );
}