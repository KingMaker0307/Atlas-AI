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
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (val: string) => {
    if (val === "") {
      setSleepHours(undefined);
      setError("Sleep hours is required or skip.");
      return;
    }
    const num = Number(val);
    setSleepHours(num);
    if (isNaN(num) || num < 0 || num > 24) {
      setError("Sleep hours must be between 0 and 24.");
    } else {
      setError(null);
    }
  };

  const handleSave = async () => {
    if (sleepHours === undefined || isNaN(sleepHours) || sleepHours < 0 || sleepHours > 24) {
      setError("Sleep hours must be between 0 and 24.");
      return;
    }
    await logRecovery({
      id: todayKey(), // Use today's date as ID for daily log
      date: todayKey(),
      sleepHours: sleepHours,
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

        {/* Workout Limit Notice */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-zinc-300 space-y-1">
          <p className="font-semibold text-emerald-400">Workout Duration Notice</p>
          <p>Please note: A workout session has a maximum limit of 3 hours. Sessions running longer will be automatically stopped and logged.</p>
        </div>

        <div>
          <Label htmlFor="sleepHours">Sleep Hours</Label>
          <Input
            id="sleepHours"
            type="number"
            step="0.1"
            min="0"
            max="24"
            value={sleepHours ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="e.g., 7.5"
          />
          {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSkip} className="flex-1">
            Skip
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!!error} className="flex-1">
            Save & Start
          </Button>
        </div>
      </Card>
    </div>
  );
}
