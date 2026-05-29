"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { X, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createId } from "@/lib/id";
import type { RecoveryLog } from "@/types/domain";

const recoverySchema = z.object({
  sleepHours: z.number().min(0, "Sleep must be at least 0 hours").max(24, "Sleep cannot exceed 24 hours"),
  soreness: z.number().min(1, "Min value is 1").max(10, "Max value is 10"),
  stress: z.number().min(1, "Min value is 1").max(10, "Max value is 10"),
  energy: z.number().min(1, "Min value is 1").max(10, "Max value is 10"),
  note: z.string().max(250, "Note must be 250 characters or less").optional(),
});

type RecoveryForm = z.infer<typeof recoverySchema>;

interface DailyRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  dailyRecoveryLog: RecoveryLog | undefined;
  logRecovery: (log: RecoveryLog) => Promise<void>;
}

export function DailyRecoveryModal({
  isOpen,
  onClose,
  selectedDate,
  dailyRecoveryLog,
  logRecovery,
}: DailyRecoveryModalProps) {
  const form = useForm<RecoveryForm>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      sleepHours: dailyRecoveryLog?.sleepHours ?? 7.5,
      soreness: dailyRecoveryLog?.soreness ?? 4,
      stress: dailyRecoveryLog?.stress ?? 3,
      energy: dailyRecoveryLog?.energy ?? 7,
      note: dailyRecoveryLog?.note ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      sleepHours: dailyRecoveryLog?.sleepHours ?? 7.5,
      soreness: dailyRecoveryLog?.soreness ?? 4,
      stress: dailyRecoveryLog?.stress ?? 3,
      energy: dailyRecoveryLog?.energy ?? 7,
      note: dailyRecoveryLog?.note ?? "",
    });
  }, [dailyRecoveryLog, form]);

  const onSubmit = async (values: RecoveryForm) => {
    // Automatically calculate readiness score (1-10) based on sleep, energy, soreness, and stress
    const sleepRating = Math.min(Math.max((values.sleepHours / 8) * 10, 1), 10);
    const calculatedReadiness = Math.round(
      (sleepRating + values.energy + (10 - values.soreness) + (10 - values.stress)) / 4
    );

    await logRecovery({
      id: dailyRecoveryLog?.id || createId("recovery"),
      date: selectedDate,
      readiness: calculatedReadiness,
      ...values,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-md p-6 space-y-4 relative">
        <Button variant="ghost" size="icon" className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5" onClick={onClose}>
          <X size={20} />
        </Button>
        <h2 className="text-xl font-semibold text-foreground">
          {dailyRecoveryLog ? "Edit Recovery Log" : "Add Recovery Log"} for {selectedDate}
        </h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sleepHours">Sleep (hours)</Label>
              <Input type="number" step="0.1" min={0} max={24} {...form.register("sleepHours", { valueAsNumber: true })} />
              {form.formState.errors.sleepHours && <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 leading-normal">{form.formState.errors.sleepHours.message}</p>}
            </div>
            <div>
              <Label htmlFor="energy">Energy (1-10)</Label>
              <Input type="number" min={1} max={10} {...form.register("energy", { valueAsNumber: true })} />
              {form.formState.errors.energy && <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 leading-normal">{form.formState.errors.energy.message}</p>}
            </div>
            <div>
              <Label htmlFor="soreness">Soreness (1-10)</Label>
              <Input type="number" min={1} max={10} {...form.register("soreness", { valueAsNumber: true })} />
              {form.formState.errors.soreness && <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 leading-normal">{form.formState.errors.soreness.message}</p>}
            </div>
            <div>
              <Label htmlFor="stress">Stress (1-10)</Label>
              <Input type="number" min={1} max={10} {...form.register("stress", { valueAsNumber: true })} />
              {form.formState.errors.stress && <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 leading-normal">{form.formState.errors.stress.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea maxLength={250} {...form.register("note")} />
            {form.formState.errors.note && <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 leading-normal">{form.formState.errors.note.message}</p>}
          </div>
          <Button type="submit" variant="primary" icon={<Save size={16} />} className="w-full">
            {dailyRecoveryLog ? "Update Log" : "Save Log"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
