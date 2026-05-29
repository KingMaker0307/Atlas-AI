"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { X, Save, Scale, Camera, Trash2, Image as ImageIcon } from "lucide-react";
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
  const [photo, setPhoto] = useState<string | undefined>(dailyBodyMetric?.photo);

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
    setPhoto(dailyBodyMetric?.photo);
  }, [dailyBodyMetric, latestBodyweight, form]);

  const onSubmit = async (values: BodyForm) => {
    await logBodyMetric({
      id: dailyBodyMetric?.id || createId("body"),
      date: selectedDate,
      ...values,
      photo,
    });
    onClose();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-md p-6 space-y-4 relative">
        <Button variant="ghost" size="icon" className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5" onClick={onClose}>
          <X size={20} />
        </Button>
        <h2 className="text-xl font-semibold text-foreground">
          {dailyBodyMetric ? "Edit Body Metrics" : "Add Body Metrics"} for {selectedDate}
        </h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="bodyweight">Weight</Label>
              <Input type="number" step="0.1" min={20} max={1000} {...form.register("bodyweight", { valueAsNumber: true })} />
              {form.formState.errors.bodyweight && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 leading-normal">{form.formState.errors.bodyweight.message}</p>}
            </div>
            <div>
              <Label htmlFor="waist">Waist</Label>
              <Input type="number" step="0.1" min={5} max={200} {...form.register("waist", { valueAsNumber: true })} />
              {form.formState.errors.waist && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 leading-normal">{form.formState.errors.waist.message}</p>}
            </div>
            <div>
              <Label htmlFor="bodyFat">Body fat</Label>
              <Input type="number" step="0.1" min={1} max={70} {...form.register("bodyFat", { valueAsNumber: true })} />
              {form.formState.errors.bodyFat && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 leading-normal">{form.formState.errors.bodyFat.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Progress Photo</Label>
            {photo ? (
              <div className="relative group overflow-hidden rounded-xl border border-surface-border aspect-video bg-surface flex items-center justify-center">
                <img
                  src={photo}
                  alt="Progress preview"
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-3">
                  <label className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20 cursor-pointer hover:bg-white/20 transition">
                    <Camera size={18} />
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setPhoto(undefined)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-zinc-100/50 dark:hover:bg-white/[0.04] p-6 text-center cursor-pointer transition group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition">
                  <Camera size={20} />
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-foreground">Upload a progress photo</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Supports PNG, JPG, or WEBP</p>
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            )}
          </div>

          <Button type="submit" variant="primary" icon={<Scale size={16} />} className="w-full">
            {dailyBodyMetric ? "Update Metrics" : "Save Metrics"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
