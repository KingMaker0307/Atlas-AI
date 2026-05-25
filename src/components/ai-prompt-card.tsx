"use client";

import { motion } from "framer-motion";
import { useState, type FC } from "react";
import { X, User, Sparkles, Weight, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { UserProfile } from "@/types/domain";

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

  const minTarget = new Date();
  minTarget.setDate(minTarget.getDate() + 7);
  const minDate = minTarget.toISOString().split("T")[0];

  const handleSubmit = () => {
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
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Generate AI Plan</h2>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X size={20} />
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
                  {profile.height} {profile.heightUnit}
                </span>
              </Surface>
            </div>
          </div>

          <div className="mb-4">
            <Label>Target Date</Label>
            <Input
              type="date"
              min={minDate}
              className="mt-2"
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
            <p className="text-red-400 text-sm font-medium mb-4">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isBusy}>
              <Sparkles size={16} className="mr-2" />
              {isBusy ? "Generating..." : "Generate Plan"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
