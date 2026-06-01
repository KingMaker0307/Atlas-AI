"use client";

import { useState } from "react";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { X } from "lucide-react";
import { todayKey } from "@/lib/id";

interface PostWorkoutCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (energy: number, soreness: number, stress: number, readiness: number) => void;
  workoutNotes: string; // New prop for workout notes
}

export function PostWorkoutCheckinModal({
  isOpen,
  onClose,
  onConfirm,
  workoutNotes, // Destructure new prop
}: PostWorkoutCheckinModalProps) {
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const logRecovery = useAtlasStore((state) => state.logRecovery);

  const lastRecovery = recoveryLogs.at(-1);

  const [energy, setEnergy] = useState<number>(lastRecovery?.energy ?? 5);
  const [soreness, setSoreness] = useState<number>(lastRecovery?.soreness ?? 5);
  const [stress, setStress] = useState<number>(lastRecovery?.stress ?? 5);
  const [readiness, setReadiness] = useState<number>(lastRecovery?.readiness ?? 5);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateScores = (eng: number, sor: number, str: number, read: number): boolean => {
    if (isNaN(eng) || eng < 1 || eng > 10) return false;
    if (isNaN(sor) || sor < 1 || sor > 10) return false;
    if (isNaN(str) || str < 1 || str > 10) return false;
    if (isNaN(read) || read < 1 || read > 10) return false;
    return true;
  };

  const handleFieldChange = (field: string, val: string) => {
    const num = Number(val);
    let nextEnergy = energy;
    let nextSoreness = soreness;
    let nextStress = stress;
    let nextReadiness = readiness;

    if (field === "energy") {
      setEnergy(num);
      nextEnergy = num;
    } else if (field === "soreness") {
      setSoreness(num);
      nextSoreness = num;
    } else if (field === "stress") {
      setStress(num);
      nextStress = num;
    } else if (field === "readiness") {
      setReadiness(num);
      nextReadiness = num;
    }

    if (!validateScores(nextEnergy, nextSoreness, nextStress, nextReadiness)) {
      setError("All metrics must be numbers between 1 and 10.");
    } else {
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!validateScores(energy, soreness, stress, readiness)) {
      setError("Please ensure all metrics are numbers between 1 and 10.");
      return;
    }
    await logRecovery({
      id: todayKey(),
      date: todayKey(),
      sleepHours: lastRecovery?.sleepHours ?? 0,
      energy,
      soreness,
      stress,
      readiness,
      note: workoutNotes, // Use workoutNotes for recovery note
    });
    onConfirm(energy, soreness, stress, readiness);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-md p-6 space-y-4 relative" role="dialog" aria-modal="true" aria-labelledby="post-workout-title">
        <Button variant="ghost" size="icon" className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5" onClick={onClose} aria-label="Close modal">
          <X size={20} aria-hidden="true" />
        </Button>
        <h2 id="post-workout-title" className="text-xl font-semibold text-foreground">Post-Workout Check-in</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Log your recovery for this session.</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="energy">Energy (1-10)</Label>
            <Input
              id="energy"
              type="number"
              min="1"
              max="10"
              value={energy || ""}
              onChange={(e) => handleFieldChange("energy", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="soreness">Soreness (1-10)</Label>
            <Input
              id="soreness"
              type="number"
              min="1"
              max="10"
              value={soreness || ""}
              onChange={(e) => handleFieldChange("soreness", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="stress">Stress (1-10)</Label>
            <Input
              id="stress"
              type="number"
              min="1"
              max="10"
              value={stress || ""}
              onChange={(e) => handleFieldChange("stress", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="readiness">Readiness (1-10)</Label>
          <Input
            id="readiness"
            type="number"
            min="1"
            max="10"
            value={readiness || ""}
            onChange={(e) => handleFieldChange("readiness", e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

        <Button variant="primary" onClick={handleSave} disabled={!!error} className="w-full">
          Log Recovery
        </Button>
      </Card>
    </div>
  );
}