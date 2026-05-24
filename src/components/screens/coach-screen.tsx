"use client";

import { motion } from "framer-motion";
import { Bot, Send, User } from "lucide-react";
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
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-[calc(100dvh-12rem)] flex-col"
    >
      <section className="mb-4 shrink-0">
        <p className="text-sm text-zinc-400">Intelligent guidance</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Coach</h1>
      </section>

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
                        <p className="font-medium text-emerald-200">
                          I've generated a new workout plan for you.
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => setActiveTab("dashboard")}
                        >
                          View on Dashboard
                        </Button>
                      </div>
                    ) : (
                      <ReactMarkdown
                        className="prose prose-invert prose-p:leading-relaxed prose-a:text-emerald-300 prose-pre:bg-black/50 max-w-none"
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
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        </div>
        <div className="shrink-0 border-t border-white/10 p-3">
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
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-300/50 focus:outline-none focus:ring-1 focus:ring-emerald-300/50"
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
    </motion.div>
  );
}