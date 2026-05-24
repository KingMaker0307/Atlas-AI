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

  if (!isOpen) return null;

  const handleSave = async () => {
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
      <Card className="w-full max-w-md p-6 space-y-4 relative">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
          <X size={20} />
        </Button>
        <h2 className="text-xl font-semibold text-white">Post-Workout Check-in</h2>
        <p className="text-zinc-400 text-sm">Log your recovery for this session.</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="energy">Energy (1-10)</Label>
            <Input
              id="energy"
              type="number"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="soreness">Soreness (1-10)</Label>
            <Input
              id="soreness"
              type="number"
              min="1"
              max="10"
              value={soreness}
              onChange={(e) => setSoreness(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="stress">Stress (1-10)</Label>
            <Input
              id="stress"
              type="number"
              min="1"
              max="10"
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
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
            value={readiness}
            onChange={(e) => setReadiness(Number(e.target.value))}
          />
        </div>

        <Button variant="primary" onClick={handleSave} className="w-full">
          Log Recovery
        </Button>
      </Card>
    </div>
  );
}