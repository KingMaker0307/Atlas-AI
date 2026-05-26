"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Dumbbell, Sparkles, ArrowRight, ArrowLeft, Check, ShieldAlert } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createId } from "@/lib/id";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { HeightUnit, WeightUnit, BodyType, Physique, EquipmentPreference } from "@/types/domain";

const providerTypes = [
  "none",
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
  equipment: z.enum(["full gym", "home gym", "bodyweight"]),
  providerType: z.enum(providerTypes),
  apiKey: z.string().max(500, "API key too long").optional(),
  injuries: z.string().max(100, "Limit description to 100 characters").optional(),
  workoutDuration: z.coerce.number().min(15, "Minimum 15 minutes").max(180, "Maximum 180 minutes"),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const trainingStyleOptions = [
  { value: "strength", label: "Strength", desc: "Focuses on raw lifting power, low repetitions (1-5 reps), and long rest times." },
  { value: "hypertrophy", label: "Hypertrophy", desc: "Optimized for muscle size and body aesthetics. Moderate reps (8-12) and volume." },
  { value: "powerbuilding", label: "Powerbuilding", desc: "A hybrid that builds raw strength in compound lifts while maximizing muscle size." },
  { value: "endurance", label: "Endurance", desc: "High reps (15+), short rest periods. Focused on stamina, joints, and work capacity." },
  { value: "general", label: "General Fitness", desc: "Balanced training for overall health, functional movement, and consistency." },
] as const;

const experienceOptions = [
  { value: "beginner", label: "Beginner", desc: "Under 1 year of lifting. Focused on learning proper form and linear progress." },
  { value: "intermediate", label: "Intermediate", desc: "1 to 3 years of consistent lifting. Familiar with main lifts and custom splits." },
  { value: "advanced", label: "Advanced", desc: "3+ years of structured lifting. High consistency, working through plateaus." },
] as const;

const equipmentOptions = [
  { value: "full gym", label: "Full Gym", desc: "Access to barbells, dumbbells, cables, and various specialized machines." },
  { value: "home gym", label: "Home Gym", desc: "Basic setup with dumbbells, resistance bands, or an adjustable bench." },
  { value: "bodyweight", label: "Bodyweight Only", desc: "No equipment required. Focuses on calisthenics, flexibility, and core strength." },
] as const;

const bodyTypeOptions = [
  { value: "ectomorph", label: "Ectomorph", desc: "Naturally lean, narrow frame, fast metabolism. Finds it harder to build mass." },
  { value: "mesomorph", label: "Mesomorph", desc: "Naturally athletic and muscular build. Responds quickly to training." },
  { value: "endomorph", label: "Endomorph", desc: "Broad, sturdy frame, slower metabolism. Gains weight easily and holds mass well." },
] as const;

const targetPhysiqueOptions = [
  { value: "lean", label: "Lean", desc: "Sleek and lean body structure." },
  { value: "athletic", label: "Athletic", desc: "Functional muscle/fat balance." },
  { value: "bulky", label: "Bulky", desc: "Maximize size and thickness." },
  { value: "shredded", label: "Shredded", desc: "Ultra-low fat, high definition." },
  { value: "toned", label: "Toned", desc: "Firm muscles, healthy look." },
] as const;

const durationOptions = [
  { value: "30", label: "Short (30 min)", desc: "Quick, high-density sessions. Best for busy schedules." },
  { value: "45", label: "Standard (45 min)", desc: "Balanced training pace. Good mix of volume & rest." },
  { value: "60", label: "Optimal (60 min)", desc: "Ideal for warm-ups, main lifts, and accessory work." },
  { value: "90", label: "Extended (90 min)", desc: "High volume strength routines. Best for longer rests." },
] as const;

function getProviderInstructions(provider: string) {
  switch (provider) {
    case "openai":
      return {
        title: "OpenAI Configuration",
        steps: [
          "Sign in to your account at platform.openai.com.",
          "Go to API Keys on the left sidebar navigation.",
          "Click '+ Create new secret key' and select permissions.",
          "Copy the key (starts with 'sk-') and paste it below."
        ],
        url: "https://platform.openai.com/api-keys"
      };
    case "anthropic":
      return {
        title: "Anthropic Configuration",
        steps: [
          "Log in to the console at console.anthropic.com.",
          "Click on 'API Keys' in your dashboard.",
          "Generate a new secret key, naming it appropriately.",
          "Copy the key (starts with 'sk-ant-') and paste it below."
        ],
        url: "https://console.anthropic.com/"
      };
    case "gemini":
      return {
        title: "Google Gemini Configuration",
        steps: [
          "Navigate to Google AI Studio at aistudio.google.com.",
          "Sign in with your Google account.",
          "Click on the 'Get API key' button in the upper left.",
          "Click 'Create API key' (either in a new or existing project) and copy it."
        ],
        url: "https://aistudio.google.com/"
      };
    case "grok":
      return {
        title: "xAI Grok Configuration",
        steps: [
          "Go to the xAI Console at console.x.ai.",
          "Sign in using your account credentials.",
          "Select API Keys from the sidebar navigation.",
          "Click 'Create API Key' and copy it."
        ],
        url: "https://console.x.ai/"
      };
    case "deepseek":
      return {
        title: "DeepSeek Configuration",
        steps: [
          "Sign in to platform.deepseek.com.",
          "Navigate to 'API Keys' in the menu sidebar.",
          "Click 'Create new API key', choose a name, and copy it."
        ],
        url: "https://platform.deepseek.com/"
      };
    case "openrouter":
      return {
        title: "OpenRouter Configuration",
        steps: [
          "Go to openrouter.ai and log in.",
          "Click on your profile or Keys in the top-right menu.",
          "Select 'Keys' and click 'Create Key'.",
          "Copy the generated key (starts with 'sk-or-') and paste it below."
        ],
        url: "https://openrouter.ai/keys"
      };
    case "ollama":
      return {
        title: "Ollama Local Configuration",
        steps: [
          "Ensure Ollama is downloaded and running on your local machine.",
          "Ensure you have pulled a model (e.g., run 'ollama run llama3' in terminal).",
          "The default local server address is http://localhost:11434.",
          "No API Key is required. You can leave the API key field blank."
        ],
        url: "https://ollama.com"
      };
    case "lmstudio":
      return {
        title: "LM Studio Local Configuration",
        steps: [
          "Open LM Studio on your local machine.",
          "Go to the Local Server tab (double-headed arrow icon).",
          "Select and load a GGUF model in the top dropdown.",
          "Click 'Start Server' (it defaults to port 1234).",
          "No API Key is required. You can leave the API key field blank."
        ],
        url: "https://lmstudio.ai"
      };
    default:
      return null;
  }
}

export function Onboarding() {
  const completeOnboarding = useAtlasStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSkip = async () => {
    try {
      await completeOnboarding({
        id: createId("user"),
        name: "Guest",
        goal: "General Fitness",
        customGoal: "General Fitness",
        experience: "beginner",
        trainingStyle: "general",
        daysPerWeek: 3,
        weightUnit: "lbs",
        heightUnit: "in",
        createdAt: new Date().toISOString(),
        age: 28,
        height: 68,
        weight: 160,
        targetPhysique: "athletic",
        bodyType: "mesomorph",
        equipment: "full gym",
        providerType: "none",
        workoutDuration: 45,
      });
    } catch (e: any) {
      setSubmitError(e.message || "Failed to skip onboarding.");
    }
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      customGoal: "",
      bodyType: "mesomorph",
      experience: "intermediate",
      trainingStyle: "powerbuilding",
      targetPhysique: "athletic",
      daysPerWeek: 4,
      weightUnit: "lbs",
      heightUnit: "in",
      equipment: "full gym",
      providerType: "none",
      apiKey: "",
      injuries: "",
      workoutDuration: 60,
    },
  });

  const selectedWeightUnit = watch("weightUnit");
  const selectedHeightUnit = watch("heightUnit");
  const selectedProvider = watch("providerType");

  const steps = [
    { id: 1, label: "Basics" },
    { id: 2, label: "Focus & Plan" },
    { id: 3, label: "Physique" },
    { id: 4, label: "AI Engine" }
  ];

  const nextStep = async () => {
    let fieldsToValidate: Array<keyof OnboardingForm> = [];
    if (step === 1) {
      fieldsToValidate = ["name", "age", "height", "weight", "heightUnit", "weightUnit"];
    } else if (step === 2) {
      fieldsToValidate = ["customGoal", "trainingStyle", "daysPerWeek", "equipment", "workoutDuration"];
    } else if (step === 3) {
      fieldsToValidate = ["bodyType", "targetPhysique", "experience", "injuries"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 4));
      setSubmitError(null);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setSubmitError(null);
  };

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        {/* App Logo & Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 justify-center">
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-zinc-950 shadow-[0_4px_20px_rgba(52,211,153,0.25)]">
              <Dumbbell size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Local-first Fitness OS</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Atlas AI Coach</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-zinc-400 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-400 px-3 py-1.5 rounded-lg transition-all self-center sm:self-auto"
          >
            Skip & Set Defaults
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="mb-6 px-2">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-zinc-800/80 -translate-y-1/2 z-0" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-emerald-400 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((s) => {
              const isCompleted = step > s.id;
              const isActive = step === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center z-10">
                  <button
                    type="button"
                    onClick={async () => {
                      // Allow moving back directly, but require validation to move forward
                      if (s.id < step) {
                        setStep(s.id);
                        setSubmitError(null);
                      } else if (s.id > step) {
                        // Check validation step by step
                        let current = step;
                        while (current < s.id) {
                          let fields: Array<keyof OnboardingForm> = [];
                          if (current === 1) fields = ["name", "age", "height", "weight"];
                          else if (current === 2) fields = ["customGoal", "trainingStyle", "daysPerWeek", "equipment"];
                          else if (current === 3) fields = ["bodyType", "targetPhysique", "experience"];

                          const ok = await trigger(fields);
                          if (!ok) break;
                          current++;
                        }
                        setStep(current);
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                      isCompleted
                        ? "bg-emerald-400 text-zinc-950 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)] cursor-pointer"
                        : isActive
                        ? "bg-zinc-950 text-emerald-400 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)] cursor-default"
                        : "bg-zinc-950 text-zinc-600 border-zinc-800 cursor-not-allowed"
                    }`}
                    disabled={s.id > step}
                  >
                    {isCompleted ? <Check size={14} className="stroke-[3]" /> : s.id}
                  </button>
                  <span className={`text-[9px] mt-2 font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isActive ? "text-emerald-400" : isCompleted ? "text-emerald-500" : "text-zinc-600"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="p-5 shadow-2xl">
          <form
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.target instanceof HTMLTextAreaElement) {
                  return;
                }
                e.preventDefault();
                if (step < 4) {
                  void nextStep();
                }
              }
            }}
            onSubmit={handleSubmit(async (values) => {
              if (step < 4) {
                void nextStep();
                return;
              }
              if (typeof navigator !== "undefined" && !navigator.onLine) {
                setSubmitError("Cannot create profile without an active internet connection. Please reconnect to continue.");
                return;
              }
              setSubmitError(null);
              try {
                await completeOnboarding({
                  id: createId("user"),
                  createdAt: new Date().toISOString(),
                  goal: values.customGoal,
                  ...values,
                });
              } catch (e: any) {
                setSubmitError(e.message || "Failed to initialize provider. Please verify your API key or local model server configuration.");
              }
            })}
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="pb-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-emerald-400" size={18} />
                      Welcome! Let's get to know you
                    </h2>
                    <p className="text-zinc-400 text-xs mt-1">
                      Atlas AI builds custom biomechanical training recommendations. Enter your baseline metrics to begin.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="name">Preferred Name</Label>
                    <p className="text-zinc-500 text-[11px] mb-1.5 leading-relaxed">
                      How should Atlas AI address you? (e.g. in greetings, motivation)
                    </p>
                    <Input id="name" maxLength={30} {...register("name")} placeholder="e.g., Jordan" autoComplete="name" />
                    {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Height System</Label>
                      <Controller
                        name="heightUnit"
                        control={control}
                        render={({ field }) => (
                          <SegmentedSetting<HeightUnit>
                            value={field.value}
                            values={["in", "cm"]}
                            onChange={(newUnit) => {
                              const currentUnit = watch("heightUnit");
                              if (currentUnit !== newUnit) {
                                const currentHeight = Number(watch("height"));
                                if (currentHeight) {
                                  const converted = newUnit === "in"
                                    ? Math.round(currentHeight / 2.54)
                                    : Math.round(currentHeight * 2.54);
                                  setValue("height", converted);
                                }
                              }
                              field.onChange(newUnit);
                            }}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Weight System</Label>
                      <Controller
                        name="weightUnit"
                        control={control}
                        render={({ field }) => (
                          <SegmentedSetting<WeightUnit>
                            value={field.value}
                            values={["lbs", "kg"]}
                            onChange={(newUnit) => {
                              const currentUnit = watch("weightUnit");
                              if (currentUnit !== newUnit) {
                                const currentWeight = Number(watch("weight"));
                                if (currentWeight) {
                                  const converted = newUnit === "lbs" 
                                    ? Math.round(currentWeight * 2.20462 * 10) / 10
                                    : Math.round((currentWeight / 2.20462) * 10) / 10;
                                  setValue("weight", converted);
                                }
                              }
                              field.onChange(newUnit);
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" min={13} max={120} {...register("age")} placeholder="e.g., 25" />
                        {errors.age && <p className="mt-1 text-xs text-rose-300">{errors.age.message}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Height ({selectedHeightUnit === "in" ? "ft & in" : "cm"})</Label>
                        {selectedHeightUnit === "in" ? (
                          <div className="grid grid-cols-2 gap-2.5 animate-fadeIn">
                            <div>
                              <Label className="text-[10px] text-zinc-500">Feet</Label>
                              <Input
                                type="number"
                                min={2}
                                max={8}
                                placeholder="e.g. 5"
                                value={watch("height") ? Math.floor(Number(watch("height")) / 12) : ""}
                                onChange={(e) => {
                                  const feet = Number(e.target.value);
                                  const inches = Number(watch("height")) % 12 || 0;
                                  setValue("height", feet * 12 + inches);
                                }}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-zinc-500">Inches</Label>
                              <Input
                                type="number"
                                min={0}
                                max={11}
                                placeholder="e.g. 10"
                                value={watch("height") ? Math.round(Number(watch("height")) % 12) : ""}
                                onChange={(e) => {
                                  const inches = Number(e.target.value);
                                  const feet = Math.floor(Number(watch("height")) / 12) || 5;
                                  setValue("height", feet * 12 + inches);
                                }}
                              />
                            </div>
                            <input type="hidden" {...register("height")} />
                          </div>
                        ) : (
                          <div>
                            <Label className="text-[10px] text-zinc-500">Value (cm)</Label>
                            <Input
                              id="height"
                              type="number"
                              min={20}
                              max={300}
                              {...register("height")}
                              placeholder="e.g., 178"
                            />
                          </div>
                        )}
                        {errors.height && <p className="mt-1 text-xs text-rose-300">{errors.height.message}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="weight">Weight ({selectedWeightUnit})</Label>
                      <Input
                        id="weight"
                        type="number"
                        min={20}
                        max={1000}
                        {...register("weight")}
                        placeholder={selectedWeightUnit === "lbs" ? "e.g., 170" : "e.g., 78"}
                      />
                      {errors.weight && <p className="mt-1 text-xs text-rose-300">{errors.weight.message}</p>}
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 italic mt-2 leading-relaxed">
                    Why we ask: Age, height, and weight are used to establish relative strength ratios and estimate energy expenditure.
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="pb-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-emerald-400" size={18} />
                      Define Your Plan Focus
                    </h2>
                    <p className="text-zinc-400 text-xs mt-1">
                      Customize the structure, style, and equipment parameters of your workout program.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="customGoal">Your Workout Goal</Label>
                    <p className="text-zinc-500 text-[11px] mb-1.5 leading-relaxed">
                      Be specific! Tell us what you want to achieve (e.g. increase squat, tone up, build core strength).
                    </p>
                    <Textarea
                      id="customGoal"
                      maxLength={120}
                      {...register("customGoal")}
                      placeholder="e.g., Build muscle size, increase bench press strength, and run twice a week."
                    />
                    {errors.customGoal && <p className="mt-1 text-xs text-rose-300">{errors.customGoal.message}</p>}
                  </div>

                  <div>
                    <Label>Training Methodology</Label>
                    <p className="text-zinc-500 text-[11px] mb-2">
                      Select how your routine structure and volume parameters should be formatted:
                    </p>
                    <Controller
                      name="trainingStyle"
                      control={control}
                      render={({ field }) => (
                        <CardGridSelector
                          value={field.value}
                          onChange={field.onChange}
                          options={trainingStyleOptions}
                        />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="daysPerWeek">Weekly Frequency (Days/Week)</Label>
                      <p className="text-zinc-500 text-[11px] mb-1.5">
                        How many training sessions can you realistically complete each week?
                      </p>
                      <Input id="daysPerWeek" type="number" min={1} max={7} {...register("daysPerWeek")} />
                      {errors.daysPerWeek && <p className="mt-1 text-xs text-rose-300">{errors.daysPerWeek.message}</p>}
                    </div>
                  </div>

                  <div>
                    <Label>Equipment Available</Label>
                    <p className="text-zinc-500 text-[11px] mb-2">
                      Specify your training environment so the AI coach schedules available movements:
                    </p>
                    <Controller
                      name="equipment"
                      control={control}
                      render={({ field }) => (
                        <CardGridSelector
                          value={field.value}
                          onChange={field.onChange}
                          options={equipmentOptions}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Preferred Workout Duration</Label>
                    <p className="text-zinc-500 text-[11px] mb-2">
                      How long do you want your routines to take? This affects generated warm-up and accessory allocations.
                    </p>
                    <Controller
                      name="workoutDuration"
                      control={control}
                      render={({ field }) => (
                        <CardGridSelector
                          value={String(field.value)}
                          onChange={(val) => field.onChange(Number(val))}
                          options={durationOptions}
                          columns={2}
                        />
                      )}
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="pb-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-emerald-400" size={18} />
                      Biometrics & Training Experience
                    </h2>
                    <p className="text-zinc-400 text-xs mt-1">
                      Fine-tune recovery tolerances and starting progression styles.
                    </p>
                  </div>

                  <div>
                    <Label>Natural Body Type</Label>
                    <p className="text-zinc-500 text-[11px] mb-2">
                      Select the structure that closest matches your skeletal frame and metabolism:
                    </p>
                    <Controller
                      name="bodyType"
                      control={control}
                      render={({ field }) => (
                        <CardGridSelector
                          value={field.value}
                          onChange={field.onChange}
                          options={bodyTypeOptions}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Lifting Experience</Label>
                    <p className="text-zinc-500 text-[11px] mb-2">
                      Your historical background with consistent weight training:
                    </p>
                    <Controller
                      name="experience"
                      control={control}
                      render={({ field }) => (
                        <CardGridSelector
                          value={field.value}
                          onChange={field.onChange}
                          options={experienceOptions}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Aesthetic Physique Goal</Label>
                    <p className="text-zinc-500 text-[11px] mb-2">
                      Choose the visual body shape direction you are focusing on:
                    </p>
                    <Controller
                      name="targetPhysique"
                      control={control}
                      render={({ field }) => (
                        <CardGridSelector
                          value={field.value}
                          onChange={field.onChange}
                          options={targetPhysiqueOptions}
                          columns={2}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="injuries">Injuries or Physical Limitations (Optional)</Label>
                    <p className="text-zinc-500 text-[11px] mb-1.5 leading-relaxed">
                      Do you have any joint issues, chronic pain, or areas to safeguard? (e.g. bad knees, lower back herniation)
                    </p>
                    <Input
                      id="injuries"
                      maxLength={100}
                      {...register("injuries")}
                      placeholder="e.g. Lower back pain, shoulder impingement, avoid squats"
                    />
                    {errors.injuries && <p className="mt-1 text-xs text-rose-300">{errors.injuries.message}</p>}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="pb-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-emerald-400" size={18} />
                      AI Coach Configuration (Optional)
                    </h2>
                    <p className="text-zinc-400 text-xs mt-1">
                      Atlas Coach is local-first and offline-first. You can connect a provider now or skip this step to configure it later in Settings.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="providerType">AI Engine Provider</Label>
                    <Select id="providerType" {...register("providerType")}>
                      {providerTypes.map((type) => (
                        <option value={type} key={type}>
                          {type === "none" ? "None (Skip for now, setup later)" :
                           type === "openai" ? "OpenAI (GPT-4o)" :
                           type === "anthropic" ? "Anthropic (Claude)" :
                           type === "gemini" ? "Google Gemini" :
                           type === "grok" ? "xAI Grok" :
                           type === "deepseek" ? "DeepSeek API" :
                           type === "openrouter" ? "OpenRouter" :
                           type === "ollama" ? "Ollama (Local Offline)" :
                           type === "lmstudio" ? "LM Studio (Local Offline)" :
                           type === "custom" ? "Custom Compatible Endpoint" :
                           type}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {selectedProvider !== "none" && (
                    <>
                      {/* Provider Key Help Card */}
                      {(() => {
                        const helper = getProviderInstructions(selectedProvider);
                        if (!helper) return null;
                        return (
                          <Surface className="p-3.5 bg-emerald-950/20 border border-emerald-500/10 text-zinc-300 rounded-xl space-y-2 animate-fadeIn">
                            <div className="flex items-center gap-2">
                              <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15 text-emerald-400">
                                <Sparkles size={11} className="stroke-[2.5]" />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                {helper.title} Steps
                              </span>
                            </div>
                            <ol className="list-decimal pl-4.5 text-[11px] text-zinc-400 space-y-1">
                              {helper.steps.map((st, i) => (
                                <li key={i} className="leading-relaxed">{st}</li>
                              ))}
                            </ol>
                            {helper.url && (
                              <a
                                href={helper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition"
                              >
                                Go to Console Website →
                              </a>
                            )}
                          </Surface>
                        );
                      })()}

                      <div>
                        <Label htmlFor="apiKey">
                          {selectedProvider === "ollama" || selectedProvider === "lmstudio"
                            ? "API Key (Optional)"
                            : "API Key (Optional - leave blank to skip)"}
                        </Label>
                        <Input
                          id="apiKey"
                          type="password"
                          maxLength={500}
                          {...register("apiKey")}
                          placeholder={
                            selectedProvider === "ollama" || selectedProvider === "lmstudio"
                              ? "Not required for local servers"
                              : "Optional - Paste key to set up now, or leave blank to skip"
                          }
                        />
                        {errors.apiKey && <p className="mt-1 text-xs text-rose-300">{errors.apiKey.message}</p>}
                      </div>
                    </>
                  )}

                  {submitError && (
                    <Surface className="p-3 bg-red-950/20 border border-red-500/15 text-rose-300 rounded-xl flex items-start gap-2.5">
                      <ShieldAlert size={16} className="mt-0.5 text-rose-400 shrink-0" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">Connection Error</span>
                        <p className="text-[11px] leading-relaxed text-zinc-300">{submitError}</p>
                      </div>
                    </Surface>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions Row */}
            <div className="mt-6 flex gap-3 border-t border-card-border pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={prevStep}
                  icon={<ArrowLeft size={16} />}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  className="ml-auto"
                  onClick={nextStep}
                  icon={<ArrowRight size={16} />}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  className="ml-auto w-full sm:w-auto"
                  disabled={isSubmitting}
                  icon={isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                >
                  {isSubmitting ? "Generating Plan..." : "Generate Workout Plan"}
                </Button>
              )}
            </div>
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
    <div className="grid gap-1 rounded-xl border border-card-border bg-input p-1" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
      {values.map((item) => (
        <button
          type="button"
          className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${
            item === value ? "bg-foreground text-background" : "text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
          }`}
          key={item}
          onClick={() => onChange(item)}
        >
          {item === "in" ? "ft & in" : item}
        </button>
      ))}
    </div>
  );
}

interface SelectorOption<T> {
  value: T;
  label: string;
  desc: string;
}

function CardGridSelector<T extends string>({
  value,
  onChange,
  options,
  columns = 1,
}: {
  value: T;
  onChange: (val: T) => void;
  options: readonly SelectorOption<T>[];
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: columns > 1 ? `repeat(${columns}, minmax(0, 1fr))` : "1fr",
      }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left p-3 rounded-xl border transition-all duration-200 ${
              isSelected
                ? "bg-emerald-500/10 border-emerald-400/80 shadow-[0_4px_16px_rgba(52,211,153,0.06)]"
                : "bg-surface border-surface-border hover:border-card-border hover:bg-input"
            }`}
          >
            <div className="flex justify-between items-center gap-2 mb-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? "text-emerald-400" : "text-zinc-200"}`}>
                {opt.label}
              </span>
              {isSelected && (
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 flex items-center justify-center text-[9px] text-zinc-950 font-bold shrink-0">
                  ✓
                </div>
              )}
            </div>
            <p className="text-[10px] leading-relaxed text-zinc-400">
              {opt.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}