"use client";

import { useState } from "react";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { X } from "lucide-react";
import { todayKey } from "@/lib/id";

interface PreWorkoutCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sleepHours: number | undefined) => void;
}

export function PreWorkoutCheckinModal({ isOpen, onClose, onConfirm }: PreWorkoutCheckinModalProps) {
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const logRecovery = useAtlasStore((state) => state.logRecovery);

  const lastSleepHours = recoveryLogs.at(-1)?.sleepHours ?? 7.5;
  const [sleepHours, setSleepHours] = useState<number | undefined>(lastSleepHours);

  if (!isOpen) return null;

  const handleSave = async () => {
    await logRecovery({
      id: todayKey(), // Use today's date as ID for daily log
      date: todayKey(),
      sleepHours: sleepHours ?? 0, // Default to 0 if undefined
      soreness: recoveryLogs.at(-1)?.soreness ?? 5, // Keep previous values or default
      stress: recoveryLogs.at(-1)?.stress ?? 5,
      readiness: recoveryLogs.at(-1)?.readiness ?? 5,
      energy: recoveryLogs.at(-1)?.energy ?? 5,
      note: recoveryLogs.at(-1)?.note ?? "",
    });
    onConfirm(sleepHours);
  };

  const handleSkip = () => {
    onConfirm(undefined); // Indicate that sleep hours were skipped
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-sm p-6 space-y-4 relative">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
          <X size={20} />
        </Button>
        <h2 className="text-xl font-semibold text-white">Pre-Workout Check-in</h2>
        <p className="text-zinc-400 text-sm">How many hours did you sleep last night?</p>

        <div>
          <Label htmlFor="sleepHours">Sleep Hours</Label>
          <Input
            id="sleepHours"
            type="number"
            step="0.1"
            min="0"
            max="16"
            value={sleepHours ?? ""}
            onChange={(e) => setSleepHours(Number(e.target.value))}
            placeholder="e.g., 7.5"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSkip} className="flex-1">
            Skip
          </Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">
            Save & Start
          </Button>
        </div>
      </Card>
    </div>
  );
}
