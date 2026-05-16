"use client";

import { motion } from "framer-motion";
import { Bot, Send, SlidersHorizontal, Sparkles } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useAtlasStore } from "@/store/useAtlasStore";

const quickPrompts = [
  "Adjust today for fatigue",
  "What should I progress next?",
  "Give me a recovery plan",
  "Nutrition target for training day",
];

export function CoachScreen() {
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const providers = useAtlasStore((state) => state.aiProviders);
  const activeProviderId = useAtlasStore((state) => state.activeProviderId);
  const sendCoachMessage = useAtlasStore((state) => state.sendCoachMessage);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const activeProvider = providers.find((provider) => provider.id === activeProviderId);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || coachBusy) return;
    setMessage("");
    await sendCoachMessage(trimmed);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 pb-28"
    >
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">Context-aware coaching</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">AI Coach</h1>
        </div>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setActiveTab("settings")}
          aria-label="AI settings"
        >
          <SlidersHorizontal size={19} />
        </Button>
      </section>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300 text-zinc-950">
            <Bot size={20} />
          </div>
          <div>
            <p className="font-semibold text-white">{activeProvider?.label ?? "Local mock coach"}</p>
            <p className="text-sm text-zinc-500">
              {activeProvider ? `${activeProvider.model} · keys encrypted locally` : "No provider required"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {quickPrompts.map((prompt) => (
            <button
              className="min-w-fit rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
              key={prompt}
              onClick={() => {
                setMessage(prompt);
                requestAnimationFrame(() => formRef.current?.requestSubmit());
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex-1 space-y-3">
        {aiMessages.map((item) => (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={item.role === "user" ? "ml-auto max-w-[88%]" : "mr-auto max-w-[92%]"}
            key={item.id}
          >
            <div
              className={
                item.role === "user"
                  ? "rounded-2xl rounded-br-md bg-emerald-300 px-4 py-3 text-sm leading-6 text-zinc-950"
                  : "rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.065] px-4 py-3 text-sm leading-6 text-zinc-200"
              }
            >
              {item.content || (
                <span className="inline-flex items-center gap-2 text-zinc-500">
                  <Sparkles size={14} /> Thinking
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <form ref={formRef} className="sticky bottom-24 z-20" onSubmit={submit}>
        <Surface className="p-2">
          <div className="flex items-end gap-2">
            <Textarea
              className="max-h-32 min-h-12 flex-1 border-transparent bg-transparent py-3"
              placeholder="Ask about training, recovery, progression, nutrition..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            <Button size="icon" variant="primary" type="submit" disabled={coachBusy || !message.trim()}>
              <Send size={18} />
            </Button>
          </div>
        </Surface>
      </form>
    </motion.div>
  );
}
