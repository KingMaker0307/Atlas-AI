"use client";

import { motion } from "framer-motion";
import { useState, useEffect, type FC } from "react";
import { X, User, Sparkles, Weight, Ruler, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { UserProfile } from "@/types/domain";
import { useAtlasStore } from "@/store/useAtlasStore";

interface AiPromptCardProps {
  profile: UserProfile;
  onCancel: () => void;
  onGenerate: (data: { targetDate: string; additionalDetails: string }) => void;
  isBusy: boolean;
}

export const AiPromptCard: FC<AiPromptCardProps> = ({ profile, onCancel, onGenerate, isBusy }) => {
  const [targetDate, setTargetDate] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [apiKeyBlocked, setApiKeyBlocked] = useState(false);

  useEffect(() => {
    const { activeProviderId, aiProviders } = useAtlasStore.getState();
    const activeProvider = aiProviders.find((p) => p.id === activeProviderId);
    const isLocal = activeProvider?.type === "ollama" || activeProvider?.type === "lmstudio";
    const hasKey = activeProvider && (isLocal || !!activeProvider.apiKey);

    if (!hasKey) {
      setError("API key is missing or invalid.");
      setApiKeyBlocked(true);
    } else if (activeProvider?.lastStatus === "error") {
      setError(
        activeProvider.lastError ??
          "The saved API key was rejected by the provider. Please update it in Settings → AI."
      );
      setApiKeyBlocked(true);
    }
  }, []);

  const minTarget = new Date();
  minTarget.setDate(minTarget.getDate() + 7);
  const minDate = minTarget.toISOString().split("T")[0];

  const handleSubmit = () => {
    const { activeProviderId, aiProviders } = useAtlasStore.getState();
    const activeProvider = aiProviders.find((p) => p.id === activeProviderId);
    const isLocal = activeProvider?.type === "ollama" || activeProvider?.type === "lmstudio";
    const hasKey = activeProvider && (isLocal || !!activeProvider.apiKey);
    if (!hasKey) {
      setError("API key is missing or invalid.");
      setApiKeyBlocked(true);
      return;
    }
    if (activeProvider?.lastStatus === "error") {
      setError(
        activeProvider.lastError ??
          "The saved API key was rejected by the provider. Please update it in Settings → AI."
      );
      setApiKeyBlocked(true);
      return;
    }

    if (!targetDate) {
      setError("Please select a target date.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(targetDate);
    const diffTime = selectedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      setError("Target date must be at least 7 days in the future.");
      return;
    }
    if (additionalDetails.length > 250) {
      setError("Additional details must be 250 characters or less.");
      return;
    }
    setError(null);
    onGenerate({ targetDate, additionalDetails });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="w-full max-w-md"
      >
        <Card className="p-4" role="dialog" aria-modal="true" aria-labelledby="generate-plan-title">
          <div className="flex items-center justify-between mb-4">
            <h2 id="generate-plan-title" className="text-lg font-semibold text-foreground">Generate AI Plan</h2>
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close panel">
              <X size={20} aria-hidden="true" />
            </Button>
          </div>

          <div className="mb-4 space-y-3">
            <h3 className="text-base font-medium text-foreground">Your Profile Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <Surface className="p-3 flex items-center gap-3">
                <User size={18} className="text-zinc-400" />
                <span className="text-sm">{profile.name}</span>
              </Surface>
              <Surface className="p-3 flex items-center gap-3">
                <Sparkles size={18} className="text-zinc-400" />
                <span className="text-sm">{profile.age} years</span>
              </Surface>
              <Surface className="p-3 flex items-center gap-3">
                <Weight size={18} className="text-zinc-400" />
                <span className="text-sm">
                  {profile.weight} {profile.weightUnit}
                </span>
              </Surface>
              <Surface className="p-3 flex items-center gap-3">
                <Ruler size={18} className="text-zinc-400" />
                <span className="text-sm">
                  {profile.height
                    ? profile.heightUnit === "in"
                      ? `${Math.floor(profile.height / 12)}'${Math.round(profile.height % 12)}"`
                      : `${profile.height} cm`
                    : "N/A"}
                </span>
              </Surface>
            </div>
          </div>

          <div className="mb-4">
            <Label>Target Date</Label>
            <Input
              type={targetDate ? "date" : "text"}
              placeholder="Pick Date"
              onFocus={(e) => {
                e.target.type = "date";
              }}
              onBlur={(e) => {
                if (!e.target.value) {
                  e.target.type = "text";
                }
              }}
              min={minDate}
              className="mt-2 h-10 text-zinc-955 dark:text-white"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>


          <div className="mb-4">
            <Label>Additional Details for AI</Label>
            <Textarea
              className="mt-2 h-24 resize-none"
              placeholder="e.g., 'I have a shoulder injury', 'I want to focus on legs', 'I only have dumbbells'"
              value={additionalDetails}
              maxLength={250}
              onChange={(e) => setAdditionalDetails(e.target.value)}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.05] dark:bg-rose-500/[0.08] p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500 dark:text-rose-400 shrink-0" aria-hidden="true" />
                <p className="text-xs font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                  {apiKeyBlocked ? "AI Provider Not Configured" : "Plan Generation Failed"}
                </p>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono break-words">
                {error}
              </p>
              {apiKeyBlocked && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Go to <span className="font-bold text-zinc-700 dark:text-zinc-200">Settings → AI</span> to fix your API key, then try again.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isBusy || apiKeyBlocked}>
              <Sparkles size={16} />
              {isBusy ? "Generating..." : "Generate Plan"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
