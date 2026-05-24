"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Dumbbell, Sparkles } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createId } from "@/lib/id";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { HeightUnit, WeightUnit, BodyType, AiProviderSettings, Physique } from "@/types/domain";

const providerTypes = [
  "openai",
  "anthropic",
  "gemini",
  "grok",
  "deepseek",
  "openrouter",
  "ollama",
  "lmstudio",
  "custom",
] as const;

const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(30, "Name must be 30 characters or less"),
  customGoal: z.string().min(8, "Add a specific goal").max(120, "Goal must be 120 characters or less"),
  bodyType: z.enum(["ectomorph", "mesomorph", "endomorph"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  trainingStyle: z.enum(["strength", "hypertrophy", "powerbuilding", "endurance", "general"]),
  targetPhysique: z.enum(["lean", "athletic", "bulky", "shredded", "toned"]),
  daysPerWeek: z.coerce.number().min(1, "Must be at least 1 day").max(7, "Must be at most 7 days"),
  weightUnit: z.enum(["lbs", "kg"]),
  heightUnit: z.enum(["in", "cm"]),
  age: z.coerce.number().min(13, "Must be at least 13").max(120, "Must be 120 or less"),
  height: z.coerce.number().min(20, "Height too low").max(300, "Height too high"),
  weight: z.coerce.number().min(20, "Weight too low").max(1000, "Weight too high"),
  providerType: z.enum(providerTypes),
  apiKey: z.string().max(500, "API key too long").optional(),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export function Onboarding() {
  const completeOnboarding = useAtlasStore((state) => state.completeOnboarding);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "Athlete",
      customGoal: "Build strength and improve my physique",
      bodyType: "mesomorph",
      experience: "intermediate",
      trainingStyle: "powerbuilding",
      targetPhysique: "athletic",
      daysPerWeek: 4,
      weightUnit: "lbs",
      heightUnit: "in",
      providerType: "openai",
    },
  });

  const selectedWeightUnit = watch("weightUnit");
  const selectedHeightUnit = watch("heightUnit");

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
          <Surface className="mb-4 flex items-start gap-3 bg-emerald-300/10 p-3">
            <Sparkles className="mt-0.5 text-emerald-200" size={18} />
            <p className="text-sm leading-6 text-zinc-300">
              Tell us about yourself to get started. We'll generate a personalized workout plan for you.
            </p>
          </Surface>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              await completeOnboarding({
                id: createId("user"),
                createdAt: new Date().toISOString(),
                goal: values.customGoal,
                ...values,
              });
            })}
          >
            <div>
              <Label>Name</Label>
              <Input maxLength={30} {...register("name")} autoComplete="name" />
              {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
            </div>

            <div>
              <Label>Custom Goal</Label>
              <Textarea maxLength={120} {...register("customGoal")} />
              {errors.customGoal && <p className="mt-1 text-xs text-rose-300">{errors.customGoal.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Body Type</Label>
                <Select {...register("bodyType")}>
                  <option value="ectomorph">Ectomorph</option>
                  <option value="mesomorph">Mesomorph</option>
                  <option value="endomorph">Endomorph</option>
                </Select>
              </div>
              <div>
                <Label>Experience</Label>
                <Select {...register("experience")}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Training Style</Label>
                <Select {...register("trainingStyle")}>
                  <option value="strength">Strength</option>
                  <option value="hypertrophy">Hypertrophy</option>
                  <option value="powerbuilding">Powerbuilding</option>
                  <option value="endurance">Endurance</option>
                  <option value="general">General</option>
                </Select>
              </div>
              <div>
                <Label>Target Physique</Label>
                <Select {...register("targetPhysique")}>
                  <option value="lean">Lean</option>
                  <option value="athletic">Athletic</option>
                  <option value="bulky">Bulky</option>
                  <option value="shredded">Shredded</option>
                  <option value="toned">Toned</option>
                </Select>
                {errors.targetPhysique && <p className="mt-1 text-xs text-rose-300">{errors.targetPhysique.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Age</Label>
                <Input type="number" min={13} max={120} {...register("age")} />
                {errors.age && <p className="mt-1 text-xs text-rose-300">{errors.age.message}</p>}
              </div>
              <div>
                <Label>Height</Label>
                <Input type="number" min={20} max={300} {...register("height")} />
                {errors.height && <p className="mt-1 text-xs text-rose-300">{errors.height.message}</p>}
              </div>
              <div>
                <Label>Weight</Label>
                <Input type="number" min={20} max={1000} {...register("weight")} />
                {errors.weight && <p className="mt-1 text-xs text-rose-300">{errors.weight.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Days Per Week</Label>
                <Input type="number" min={1} max={7} {...register("daysPerWeek")} />
                {errors.daysPerWeek && <p className="mt-1 text-xs text-rose-300">{errors.daysPerWeek.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Height Unit</Label>
                <Controller
                  name="heightUnit"
                  control={control}
                  render={({ field }) => (
                    <SegmentedSetting<HeightUnit>
                      value={field.value}
                      values={["in", "cm"]}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div>
                <Label>Weight Unit</Label>
                <Controller
                  name="weightUnit"
                  control={control}
                  render={({ field }) => (
                    <SegmentedSetting<WeightUnit>
                      value={field.value}
                      values={["lbs", "kg"]}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Label>AI Provider</Label>
              <Select {...register("providerType")}>
                {providerTypes.map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>API Key</Label>
              <Input type="password" maxLength={500} {...register("apiKey")} />
              {errors.apiKey && <p className="mt-1 text-xs text-rose-300">{errors.apiKey.message}</p>}
            </div>

            <Button className="w-full" size="lg" variant="primary" disabled={isSubmitting}>
              Generate Workout Plan
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

function SegmentedSetting<T extends string>({
  value,
  values,
  onChange,
}: {
  value: T;
  values: T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-1 rounded-xl border border-white/10 bg-black/25 p-1" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
      {values.map((item) => (
        <button
          type="button"
          className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${
            item === value ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-white/10 hover:text-white"
          }`}
          key={item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}