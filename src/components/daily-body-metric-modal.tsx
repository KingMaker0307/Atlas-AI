"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { X, Save, Scale } from "lucide-react";
import { Card, Surface } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createId } from "@/lib/id";
import type { BodyMetric } from "@/types/domain";

const bodySchema = z.object({
  bodyweight: z.number().min(20, "Must be at least 20").max(1000, "Must be at most 1000"),
  waist: z.number().min(5, "Must be at least 5").max(200, "Must be at most 200"),
  bodyFat: z.number().min(1, "Must be at least 1%").max(70, "Must be at most 70%"),
});

type BodyForm = z.infer<typeof bodySchema>;

interface DailyBodyMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  dailyBodyMetric: BodyMetric | undefined;
  logBodyMetric: (metric: BodyMetric) => Promise<void>;
  latestBodyweight?: number;
}

export function DailyBodyMetricModal({
  isOpen,
  onClose,
  selectedDate,
  dailyBodyMetric,
  logBodyMetric,
  latestBodyweight,
}: DailyBodyMetricModalProps) {
  const form = useForm<BodyForm>({
    resolver: zodResolver(bodySchema),
    defaultValues: {
      bodyweight: dailyBodyMetric?.bodyweight || latestBodyweight || 0,
      waist: dailyBodyMetric?.waist ?? 0,
      bodyFat: dailyBodyMetric?.bodyFat ?? 0,
    },
  });

  useEffect(() => {
    form.reset({
      bodyweight: dailyBodyMetric?.bodyweight || latestBodyweight || 0,
      waist: dailyBodyMetric?.waist ?? 0,
      bodyFat: dailyBodyMetric?.bodyFat ?? 0,
    });
  }, [dailyBodyMetric, latestBodyweight, form]);

  const onSubmit = async (values: BodyForm) => {
    await logBodyMetric({
      id: dailyBodyMetric?.id || createId("body"),
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
          {dailyBodyMetric ? "Edit Body Metrics" : "Add Body Metrics"} for {selectedDate}
        </h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="bodyweight">Weight</Label>
              <Input type="number" step="0.1" min={20} max={1000} {...form.register("bodyweight", { valueAsNumber: true })} />
              {form.formState.errors.bodyweight && <p className="mt-1 text-[10px] text-rose-300 leading-normal">{form.formState.errors.bodyweight.message}</p>}
            </div>
            <div>
              <Label htmlFor="waist">Waist</Label>
              <Input type="number" step="0.1" min={5} max={200} {...form.register("waist", { valueAsNumber: true })} />
              {form.formState.errors.waist && <p className="mt-1 text-[10px] text-rose-300 leading-normal">{form.formState.errors.waist.message}</p>}
            </div>
            <div>
              <Label htmlFor="bodyFat">Body fat</Label>
              <Input type="number" step="0.1" min={1} max={70} {...form.register("bodyFat", { valueAsNumber: true })} />
              {form.formState.errors.bodyFat && <p className="mt-1 text-[10px] text-rose-300 leading-normal">{form.formState.errors.bodyFat.message}</p>}
            </div>
          </div>
          <Surface className="border-dashed border-white/10 text-sm text-zinc-500">
            Progress photo storage is ready for local image attachments in a future build.
          </Surface>
          <Button type="submit" variant="primary" icon={<Scale size={16} />} className="w-full">
            {dailyBodyMetric ? "Update Metrics" : "Save Metrics"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
