"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Dumbbell, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createId } from "@/lib/id";
import { useAtlasStore } from "@/store/useAtlasStore";

const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  goal: z.string().min(8, "Add a specific goal"),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  trainingStyle: z.enum(["strength", "hypertrophy", "powerbuilding", "endurance", "general"]),
  daysPerWeek: z.number().min(1).max(7),
  units: z.enum(["metric", "imperial"]),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export function Onboarding() {
  const completeOnboarding = useAtlasStore((state) => state.completeOnboarding);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "Athlete",
      goal: "Build strength while staying recovered",
      experience: "intermediate",
      trainingStyle: "powerbuilding",
      daysPerWeek: 4,
      units: "imperial",
    },
  });

  return (
    <main className="min-h-dvh bg-[#07080a] px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-zinc-950">
            <Dumbbell size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-200">Local-first fitness OS</p>
            <h1 className="text-3xl font-semibold tracking-normal">Atlas AI Coach</h1>
          </div>
        </div>

        <Card className="p-4">
          <Surface className="mb-4 flex items-start gap-3 bg-emerald-300/10">
            <Sparkles className="mt-0.5 text-emerald-200" size={18} />
            <p className="text-sm leading-6 text-zinc-300">
              Your plan, training logs, AI memory, and provider keys stay on this device unless
              you export them.
            </p>
          </Surface>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              await completeOnboarding({
                id: createId("user"),
                ...values,
                createdAt: new Date().toISOString(),
              });
            })}
          >
            <div>
              <Label>Name</Label>
              <Input {...register("name")} autoComplete="name" />
              {errors.name ? <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p> : null}
            </div>

            <div>
              <Label>Goal</Label>
              <Textarea {...register("goal")} />
              {errors.goal ? <p className="mt-1 text-xs text-rose-300">{errors.goal.message}</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Experience</Label>
                <Select {...register("experience")}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
              <div>
                <Label>Days</Label>
                <Input type="number" min={1} max={7} {...register("daysPerWeek", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Style</Label>
                <Select {...register("trainingStyle")}>
                  <option value="strength">Strength</option>
                  <option value="hypertrophy">Hypertrophy</option>
                  <option value="powerbuilding">Powerbuilding</option>
                  <option value="endurance">Endurance</option>
                  <option value="general">General</option>
                </Select>
              </div>
              <div>
                <Label>Units</Label>
                <Select {...register("units")}>
                  <option value="imperial">lb / in</option>
                  <option value="metric">kg / cm</option>
                </Select>
              </div>
            </div>

            <Button className="w-full" size="lg" variant="primary" disabled={isSubmitting}>
              Start coaching
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
