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
  sleepHours: z.number().min(0).max(16),
  soreness: z.number().min(1).max(10),
  stress: z.number().min(1).max(10),
  readiness: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  note: z.string().optional(),
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
      readiness: dailyRecoveryLog?.readiness ?? 8,
      energy: dailyRecoveryLog?.energy ?? 7,
      note: dailyRecoveryLog?.note ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      sleepHours: dailyRecoveryLog?.sleepHours ?? 7.5,
      soreness: dailyRecoveryLog?.soreness ?? 4,
      stress: dailyRecoveryLog?.stress ?? 3,
      readiness: dailyRecoveryLog?.readiness ?? 8,
      energy: dailyRecoveryLog?.energy ?? 7,
      note: dailyRecoveryLog?.note ?? "",
    });
  }, [dailyRecoveryLog, form]);

  const onSubmit = async (values: RecoveryForm) => {
    await logRecovery({
      id: dailyRecoveryLog?.id || createId("recovery"),
      date: selectedDate,
      ...values,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-md p-6 space-y-4 relative">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
          <X size={20} />
        </Button>
        <h2 className="text-xl font-semibold text-white">
          {dailyRecoveryLog ? "Edit Recovery Log" : "Add Recovery Log"} for {selectedDate}
        </h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sleepHours">Sleep (hours)</Label>
              <Input type="number" step="0.1" {...form.register("sleepHours", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="energy">Energy (1-10)</Label>
              <Input type="number" min="1" max="10" {...form.register("energy", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="soreness">Soreness (1-10)</Label>
              <Input type="number" min="1" max="10" {...form.register("soreness", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="stress">Stress (1-10)</Label>
              <Input type="number" min="1" max="10" {...form.register("stress", { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <Label htmlFor="readiness">Readiness (1-10)</Label>
            <Input type="number" min="1" max="10" {...form.register("readiness", { valueAsNumber: true })} />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea {...form.register("note")} />
          </div>
          <Button type="submit" variant="primary" icon={<Save size={16} />} className="w-full">
            {dailyRecoveryLog ? "Update Log" : "Save Log"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
