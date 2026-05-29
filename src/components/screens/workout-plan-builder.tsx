"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useAtlasStore, assignRoutinesToDays } from "@/store/useAtlasStore";
import { useState, useMemo, useRef, useEffect, type FC } from "react";
import { AiPromptCard } from "@/components/ai-prompt-card";
import type { WorkoutPlan } from "@/types/domain";
import { createId } from "@/lib/id";
import { getExerciseById as getStaticExerciseById } from "@/data/exercises";
import {
  planTemplates,
  templateCategories,
  getTemplatesByCategory,
  filterAndRankTemplates,
  templateToRoutines,
  type PlanTemplate,
  type TemplateFilters,
} from "@/data/plan-templates";
import {
  ArrowLeft,
  Search,
  Clock,
  CalendarDays,
  Dumbbell,
  Star,
  ChevronRight,
  ChevronLeft,
  Layers,
  Zap,
  User,
  X,
  Sparkles,
  Check,
  ListChecks,
  AlertTriangle,
  Settings,
} from "lucide-react";

// ─── Sub-views ───────────────────────────────────────────────

type BuilderView = "choose-method" | "templates" | "template-detail" | "manual-form";

// ─── Template Card ───────────────────────────────────────────

const TemplateCard: FC<{
  template: PlanTemplate;
  isRecommended: boolean;
  onClick: () => void;
}> = ({ template, isRecommended, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.015 }}
    whileTap={{ scale: 0.98 }}
    className="cursor-pointer"
    onClick={onClick}
  >
    <Card className="p-0 overflow-hidden relative group transition-all hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]">
      {isRecommended && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
          <Star size={10} fill="currentColor" />
          Recommended
        </div>
      )}

      {/* Header gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-tight">{template.name}</h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-0.5">by {template.origin}</p>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {template.description}
        </p>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <CalendarDays size={10} />
            {template.daysPerWeek.length === 1
               ? `${template.daysPerWeek[0]}×/wk`
               : `${template.daysPerWeek[0]}-${template.daysPerWeek[template.daysPerWeek.length - 1]}×/wk`}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Clock size={10} />
            {template.durationMinutes}m
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400">
            <Layers size={10} />
            {template.routines.length} routines
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.experience.map((exp) => (
            <span
              key={exp}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                exp === "beginner"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : exp === "intermediate"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-red-500/15 text-red-400"
              }`}
            >
              {exp}
            </span>
          ))}
          {template.equipment.map((eq) => (
            <span key={eq} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400">
              {eq}
            </span>
          ))}
        </div>
      </div>

      {/* Hover action hint */}
      <div className="flex items-center justify-end px-4 py-2 border-t border-white/5 bg-white/[0.02]">
        <span className="text-xs text-zinc-500 group-hover:text-violet-400 transition-colors flex items-center gap-1">
          View details <ChevronRight size={12} />
        </span>
      </div>
    </Card>
  </motion.div>
);

// ─── Template Detail View ────────────────────────────────────

const TemplateDetailView: FC<{
  template: PlanTemplate;
  onBack: () => void;
  onUseTemplate: () => void;
}> = ({ template, onBack, onUseTemplate }) => {
  const storeExercises = useAtlasStore((state) => state.exercises);
  const getExerciseById = (id: string) => {
    return storeExercises.find((e) => e.id === id) || getStaticExerciseById(id);
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-4 pb-28"
    >
    {/* Header */}
    <section className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-normal text-foreground">{template.name}</h1>
          <p className="text-xs text-zinc-500">by {template.origin}</p>
        </div>
      </div>
      <Button onClick={onUseTemplate} className="gap-2">
        <Sparkles size={14} />
        Use Template
      </Button>
    </section>

    {/* Description */}
    <Card className="p-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{template.description}</p>
    </Card>

    {/* Stats grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Surface className="flex flex-col items-center gap-1 py-3">
        <CalendarDays size={16} className="text-violet-600 dark:text-violet-400" />
        <span className="text-lg font-bold text-foreground">
          {template.daysPerWeek.length === 1
            ? template.daysPerWeek[0]
            : `${template.daysPerWeek[0]}-${template.daysPerWeek[template.daysPerWeek.length - 1]}`}
        </span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Days / Week</span>
      </Surface>
      <Surface className="flex flex-col items-center gap-1 py-3">
        <Clock size={16} className="text-fuchsia-600 dark:text-fuchsia-400" />
        <span className="text-lg font-bold text-foreground">{template.durationMinutes}m</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Session</span>
      </Surface>
      <Surface className="flex flex-col items-center gap-1 py-3">
        <Layers size={16} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-lg font-bold text-foreground">{template.routines.length}</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Routines</span>
      </Surface>
      <Surface className="flex flex-col items-center gap-1 py-3">
        <Dumbbell size={16} className="text-amber-600 dark:text-amber-400" />
        <span className="text-lg font-bold text-foreground">
          {new Set(template.routines.flatMap((r) => r.exercises.map((e) => e.exerciseId))).size}
        </span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Exercises</span>
      </Surface>
    </div>

    {/* Info chips */}
    <div className="flex flex-wrap gap-2">
      {template.trainingStyles.map((s) => (
        <span key={s} className="rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 capitalize">{s}</span>
      ))}
      {template.experience.map((e) => (
        <span key={e} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
          e === "beginner" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
          e === "intermediate" ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" :
          "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
        }`}>{e}</span>
      ))}
      {template.targetPhysiques.map((p) => (
        <span key={p} className="rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 capitalize">{p}</span>
      ))}
    </div>

    {/* Routines breakdown */}
    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider pt-2">Routine Breakdown</h2>
    <div className="space-y-3">
      {template.routines.map((routine, idx) => (
        <Card key={idx} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{routine.name}</h3>
              <p className="text-xs text-zinc-500">{routine.focus}</p>
            </div>
            <span className="text-xs text-zinc-555 dark:text-zinc-500 flex items-center gap-1">
              <Clock size={10} /> {routine.estimatedMinutes}m
            </span>
          </div>

          <div className="space-y-1.5">
            {routine.exercises.map((ex, exIdx) => {
              const exerciseData = getExerciseById(ex.exerciseId);
              return (
                <div key={exIdx} className="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                      {exIdx + 1}
                    </span>
                    <span className="text-xs text-zinc-300">
                      {exerciseData?.name ?? ex.exerciseId}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {ex.targetSets} × {ex.targetReps} &middot; {ex.restSeconds}s rest
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>

    {/* Bottom CTA */}
    <div className="pt-4">
      <Button onClick={onUseTemplate} className="w-full gap-2 py-3">
        <Sparkles size={16} />
        Use This Template
      </Button>
    </div>
  </motion.div>
  );
};

// ─── Category Pill ───────────────────────────────────────────

const CategoryPill: FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
      active
        ? "border-violet-500/50 bg-violet-500/20 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
        : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/10"
    }`}
  >
    {label}
  </button>
);

// ─── Main Component ──────────────────────────────────────────

export function WorkoutPlanBuilderScreen() {
  const storeExercises = useAtlasStore((state) => state.exercises);
  const getExerciseById = (id: string) => {
    return storeExercises.find((e) => e.id === id) || getStaticExerciseById(id);
  };
  const saveWorkoutPlan = useAtlasStore((state) => state.saveWorkoutPlan);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const editingWorkoutPlanId = useAtlasStore((state) => state.editingWorkoutPlanId);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const profile = useAtlasStore((state) => state.profile);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const sendCoachMessage = useAtlasStore((state) => state.sendCoachMessage);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const setActiveSettingsTab = useAtlasStore((state) => state.setActiveSettingsTab);

  // ── View state ──
  const [view, setView] = useState<BuilderView>(editingWorkoutPlanId ? "manual-form" : "choose-method");
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null);
  const [showAiCard, setShowAiCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAiErrorModal, setShowAiErrorModal] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState("");

  // Detect when AI generation finishes with an error
  const prevCoachBusy = useRef(false);
  useEffect(() => {
    if (prevCoachBusy.current && !coachBusy) {
      const lastMsg = aiMessages.at(-1);
      if (lastMsg?.role === "assistant" && lastMsg.content.includes("**Error:**")) {
        const parts = lastMsg.content.split("**Error:**");
        setAiErrorMessage(parts.length > 1 ? parts[1].trim() : lastMsg.content);
        setShowAiErrorModal(true);
        setShowAiCard(false);
      }
    }
    prevCoachBusy.current = coachBusy;
  }, [coachBusy, aiMessages]);

  // Start Day Selection Popup State
  const [showStartDayModal, setShowStartDayModal] = useState(false);
  const [selectedStartDay, setSelectedStartDay] = useState("Monday");
  const [startDayTarget, setStartDayTarget] = useState<"template" | "ai" | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<PlanTemplate | null>(null);
  const [pendingAiData, setPendingAiData] = useState<{ targetDate: string; additionalDetails: string } | null>(null);

  // ── Template browser state ──
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExperience, setFilterExperience] = useState<string | null>(null);
  const [filterDays, setFilterDays] = useState<number | null>(null);
  const [filterDuration, setFilterDuration] = useState<number | null>(null);

  // ── Manual form state ──
  const [plan, setPlan] = useState<WorkoutPlan>(() => {
    if (editingWorkoutPlanId) {
      const existingPlan = workoutPlans.find(p => p.id === editingWorkoutPlanId);
      return existingPlan ? { ...existingPlan } : { id: createId("plan"), name: "New Plan", goal: "", routines: [] };
    }
    return { id: createId("plan"), name: "New Plan", goal: "", routines: [], creatorType: "manual", startDay: "Monday" };
  });

  // ── Derived: user-profile-based filters ──
  const profileFilters: TemplateFilters = useMemo(() => ({
    trainingStyle: profile?.trainingStyle,
    experience: profile?.experience,
    equipment: profile?.equipment,
    daysPerWeek: profile?.daysPerWeek,
    durationMinutes: profile?.workoutDuration,
  }), [profile]);

  // ── Derived: active templates ──
  const filteredTemplates = useMemo(() => {
    const categoryTemplates = getTemplatesByCategory(activeCategory);
    const filters: TemplateFilters = {
      searchQuery: searchQuery || undefined,
      equipment: profileFilters.equipment,
    };
    if (filterExperience) filters.experience = filterExperience as "beginner" | "intermediate" | "advanced";
    if (filterDays) filters.daysPerWeek = filterDays;
    if (filterDuration) filters.durationMinutes = filterDuration;

    // Score by profile match but don't hard-filter by it
    return filterAndRankTemplates(categoryTemplates, {
      ...filters,
      trainingStyle: profileFilters.trainingStyle,
      experience: filters.experience ?? profileFilters.experience,
      daysPerWeek: filters.daysPerWeek ?? profileFilters.daysPerWeek,
      durationMinutes: filters.durationMinutes ?? profileFilters.durationMinutes,
    });
  }, [activeCategory, searchQuery, filterExperience, filterDays, filterDuration, profileFilters]);

  // ── Recommended check ──
  const isRecommendedForProfile = (template: PlanTemplate): boolean => {
    if (!profile) return false;
    const matchStyle = template.trainingStyles.includes(profile.trainingStyle);
    const matchExp = template.experience.includes(profile.experience);
    const matchEquip = !profile.equipment || template.equipment.includes(profile.equipment);
    const matchDays = template.daysPerWeek.includes(profile.daysPerWeek);
    return matchStyle && matchExp && matchEquip && matchDays;
  };

  // ── Actions ──
  const handleSave = () => {
    const name = plan.name.trim();
    const goal = plan.goal.trim();
    if (name.length === 0) { setError("Plan name is required."); return; }
    if (name.length > 40) { setError("Plan name must be 40 characters or less."); return; }
    if (goal.length > 120) { setError("Goal must be 120 characters or less."); return; }
    setError(null);
    saveWorkoutPlan({
      ...plan,
      name,
      goal,
      creatorType: plan.creatorType || "manual",
      startDay: plan.startDay || "Monday",
    });
    setActiveSubScreen(null);
  };

  const handleUseTemplate = (template: PlanTemplate, startDay: string) => {
    const rawRoutines = templateToRoutines(template);
    const routines = assignRoutinesToDays(rawRoutines, startDay);
    const newPlan: WorkoutPlan = {
      id: createId("plan"),
      name: template.name,
      goal: template.trainingStyles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" & "),
      routines,
      creatorType: "template",
      startDay: startDay as any,
    };
    saveWorkoutPlan(newPlan);
    setActiveSubScreen(null);
  };

  const handleSeedSplit = (type: "ppl" | "upper-lower" | "full-body") => {
    let routines: any[] = [];
    let goal = "";
    let name = "";
    
    const startDay = plan.startDay || "Monday";

    if (type === "ppl") {
      name = "PPL Power & Hypertrophy";
      goal = "Targeted muscular adaptations with Push, Pull, and Legs routines";
      routines = [
        {
          id: createId("routine"),
          name: "Push Day",
          focus: "Chest, Shoulders & Triceps",
          estimatedMinutes: 60,
          day: "Day 1",
          exercises: [
            { exerciseId: "bench-press", targetSets: 4, targetReps: "8-12", restSeconds: 90 },
            { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "8-12", restSeconds: 75 },
            { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10-12", restSeconds: 75 },
            { exerciseId: "tricep-pushdown", targetSets: 3, targetReps: "12-15", restSeconds: 60 }
          ]
        },
        {
          id: createId("routine"),
          name: "Pull Day",
          focus: "Back, Rear Delts & Biceps",
          estimatedMinutes: 60,
          day: "Day 2",
          exercises: [
            { exerciseId: "deadlift", targetSets: 3, targetReps: "5", restSeconds: 120 },
            { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "8-12", restSeconds: 75 },
            { exerciseId: "barbell-row", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
            { exerciseId: "dumbbell-curl", targetSets: 3, targetReps: "12-15", restSeconds: 60 }
          ]
        },
        {
          id: createId("routine"),
          name: "Legs Day",
          focus: "Quads, Hamstrings & Calves",
          estimatedMinutes: 60,
          day: "Day 3",
          exercises: [
            { exerciseId: "barbell-back-squat", targetSets: 4, targetReps: "6-8", restSeconds: 120 },
            { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "8-10", restSeconds: 90 },
            { exerciseId: "leg-press", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
            { exerciseId: "calf-raise-machine", targetSets: 3, targetReps: "15", restSeconds: 60 }
          ]
        }
      ];
    } else if (type === "upper-lower") {
      name = "Upper/Lower Hypertrophy Split";
      goal = "High frequency stimulation of upper and lower halves";
      routines = [
        {
          id: createId("routine"),
          name: "Upper Body",
          focus: "Chest, Back & Arms",
          estimatedMinutes: 60,
          day: "Day 1",
          exercises: [
            { exerciseId: "bench-press", targetSets: 4, targetReps: "8-12", restSeconds: 90 },
            { exerciseId: "barbell-row", targetSets: 4, targetReps: "8-12", restSeconds: 90 },
            { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "10-12", restSeconds: 75 },
            { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "10-12", restSeconds: 75 }
          ]
        },
        {
          id: createId("routine"),
          name: "Lower Body",
          focus: "Quads, Hamstrings & Core",
          estimatedMinutes: 60,
          day: "Day 2",
          exercises: [
            { exerciseId: "barbell-back-squat", targetSets: 4, targetReps: "8-10", restSeconds: 120 },
            { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
            { exerciseId: "leg-extension", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
            { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "15", restSeconds: 60 }
          ]
        }
      ];
    } else if (type === "full-body") {
      name = "Full Body Strength & Conditioning";
      goal = "Functional full body movements with recovery pacing";
      routines = [
        {
          id: createId("routine"),
          name: "Full Body A",
          focus: "Squat, Push & Pull focus",
          estimatedMinutes: 60,
          day: "Day 1",
          exercises: [
            { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "8-10", restSeconds: 120 },
            { exerciseId: "bench-press", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
            { exerciseId: "barbell-row", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
            { exerciseId: "plank", targetSets: 3, targetReps: "60s", restSeconds: 60 }
          ]
        },
        {
          id: createId("routine"),
          name: "Full Body B",
          focus: "Deadlift & Shoulder focus",
          estimatedMinutes: 60,
          day: "Day 2",
          exercises: [
            { exerciseId: "deadlift", targetSets: 3, targetReps: "5", restSeconds: 120 },
            { exerciseId: "overhead-press", targetSets: 3, targetReps: "8-10", restSeconds: 90 },
            { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "10-12", restSeconds: 75 },
            { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "15", restSeconds: 60 }
          ]
        }
      ];
    }

    const assignedRoutines = assignRoutinesToDays(routines, startDay);

    setPlan({
      ...plan,
      name,
      goal,
      routines: assignedRoutines,
      creatorType: "manual"
    });
  };

  const handleGeneratePlan = async ({ targetDate, additionalDetails, startDay }: { targetDate: string; additionalDetails: string; startDay: string }) => {
    setShowAiCard(false);
    setActiveSubScreen(null);
    setActiveTab("dashboard");
    if (!profile) return;

    const { experience, bodyType, age, height, weight, heightUnit, weightUnit, trainingStyle, daysPerWeek, goal } = profile;
    const prompt = `You are a professional fitness coach. The user wants a workout plan.
    
    User Profile:
    - Experience: ${experience}
    - Body Type: ${bodyType}
    - Age: ${age}
    - Height: ${heightUnit === "in" ? `${Math.floor((height ?? 0) / 12)}'${Math.round((height ?? 0) % 12)}"` : `${height} cm`}
    - Weight: ${weight} ${weightUnit}
    - Primary Goal: ${goal}
    - Training Style: ${trainingStyle}
    - Days Per Week: ${daysPerWeek}
    
    Target Date to achieve this goal: ${targetDate}.
    Start Day of Week: ${startDay}.
    
    Additional Details: ${additionalDetails || "None"}

    CRITICAL INSTRUCTIONS:
    1. First, calculate if their goal is realistically achievable by the Target Date: ${targetDate}.
       - If the goal is NOT realistically achievable within this timeframe (e.g. losing 15kg in 2 weeks, or building 10kg of muscle in a month), or if the target date is less than 7 days in the future, you MUST write a prominent and friendly warning explanation at the very beginning of your message (before the JSON block), warning them about the risks/unrealistic nature of the timeline, and giving clear suggestions to use as feedback to change the target date or give the normal aggressive training state understanding.
       - If the goal is achievable, write a brief, encouraging confirmation.
    
    2. YOU MUST INCLUDE the complete Exercise profile details inside the \`exercises\` JSON array for EVERY single exerciseId referenced in the \`routines\` array. Under no circumstances should you reference an exercise ID in a routine without including its full biomechanical definition in the \`exercises\` array.
    
    3. Then, output the structured workout plan in a JSON block wrapped in \`\`\`json ... \`\`\` matching this format:
    {
      "id": "generated-plan-id",
      "name": "Plan Name",
      "goal": "A summary of the workout plan goal",
      "notes": "A detailed warning, suggestion to change the target date, or explanation of the normal aggressive program requirements if the target date or calculation of the workout is not achievable. Leave as null or empty string if it is realistically achievable.",
      "routines": [
        {
          "id": "routine-1",
          "name": "Day 1: Upper Focus",
          "focus": "Strength",
          "estimatedMinutes": 60,
          "day": "Day 1",
          "exercises": [
            {
              "exerciseId": "bench-press",
              "targetSets": 4,
              "targetReps": "8-12",
              "restSeconds": 90
            }
          ]
        }
      ],
      "exercises": [
        {
          "id": "bench-press",
          "name": "Bench Press",
          "category": "compound",
          "muscles": ["chest", "triceps", "shoulders"],
          "equipment": ["barbell"],
          "difficulty": "intermediate",
          "setup": ["Plant feet, set shoulder blades down and back.", "Grip slightly wider than shoulder-width."],
          "instructions": ["Lower the bar to lower chest under control.", "Press up and slightly back."],
          "execution": ["Unrack with locked shoulders.", "Touch chest without bouncing.", "Finish with elbows extended."],
          "breathing": "Brace before the descent, hold through the press, reset at the top.",
          "tempo": "2-3 seconds down, soft touch, powerful press.",
          "commonMistakes": ["Flaring elbows early", "Bouncing off the chest"],
          "safetyTips": ["Use a spotter or safeties for hard sets."],
          "progressionTips": ["Add 2.5 lb when top-set reps exceed the target range."]
        }
      ]
    }`;
    
    const displayedContent = additionalDetails 
      ? `Generate a new workout plan for me starting on ${startDay} with the following additional details: ${additionalDetails}`
      : `Generate a new workout plan for me starting on ${startDay} based on my profile.`;
      
    await sendCoachMessage(prompt, { isRoutineGeneration: true, displayedContent, startDay });
  };

  const handleConfirmStartDay = () => {
    if (startDayTarget === "template" && pendingTemplate) {
      handleUseTemplate(pendingTemplate, selectedStartDay);
    } else if (startDayTarget === "ai" && pendingAiData) {
      void handleGeneratePlan({
        targetDate: pendingAiData.targetDate,
        additionalDetails: pendingAiData.additionalDetails,
        startDay: selectedStartDay,
      });
    }
    setShowStartDayModal(false);
    setPendingTemplate(null);
    setPendingAiData(null);
    setStartDayTarget(null);
  };

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════

  return (
    <>
      <AnimatePresence>
        {showAiCard && profile && (
          <AiPromptCard
            profile={profile}
            onCancel={() => setShowAiCard(false)}
            onGenerate={({ targetDate, additionalDetails }) => {
              setPendingAiData({ targetDate, additionalDetails });
              setStartDayTarget("ai");
              setSelectedStartDay("Monday");
              setShowStartDayModal(true);
            }}
            isBusy={coachBusy}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ── Choose Method ── */}
        {view === "choose-method" && (
        <motion.div
          key="choose"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-6 pb-28"
        >
          <section className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setActiveSubScreen(null)}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-normal text-foreground">Create Workout Plan</h1>
          </section>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Choose how you want to build your plan.
          </p>

          {/* AI Generation option */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Card
              className="p-0 overflow-hidden cursor-pointer group transition-all hover:border-purple-500/40"
              onClick={() => {
                if (activeWorkout) {
                  const confirmGen = window.confirm(
                    "You have a workout session in progress. Generating a new plan with AI will discard your current active workout and replace your existing plans. Do you want to continue?"
                  );
                  if (!confirmGen) return;
                }
                setShowAiCard(true);
              }}
            >
              <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="p-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 shrink-0">
                  <Sparkles size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-semibold text-foreground">Generate with AI</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Let the AI Coach design a customized training program tailored exactly to your body type, goals, equipment, and schedule.
                  </p>
                </div>
                <ChevronRight size={20} className="text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-1 shrink-0" />
              </div>
            </Card>
          </motion.div>

          {/* Template option */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Card
              className="p-0 overflow-hidden cursor-pointer group transition-all hover:border-violet-500/40"
              onClick={() => setView("templates")}
            >
              <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="p-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 shrink-0">
                  <ListChecks size={24} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-semibold text-foreground">Use a Template</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Choose from {planTemplates.length}+ world-class programs like 5/3/1, PPL, PHUL, StrongLifts, and more.
                    Auto-matched to your profile.
                  </p>
                </div>
                <ChevronRight size={20} className="text-zinc-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mt-1 shrink-0" />
              </div>
              <div className="flex flex-wrap gap-1.5 px-5 pb-4">
                {["Strength", "Hypertrophy", "Bodyweight", "Home Gym", "HIIT"].map(tag => (
                  <span key={tag} className="rounded-full bg-zinc-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">{tag}</span>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Manual option */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Card
              className="p-0 overflow-hidden cursor-pointer group transition-all hover:border-emerald-500/40"
              onClick={() => setView("manual-form")}
            >
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="p-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  <Dumbbell size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-semibold text-foreground">Build From Scratch</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Create a fully custom plan with your own routines and exercises. Total control over every detail.
                  </p>
                </div>
                <ChevronRight size={20} className="text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-1 shrink-0" />
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* ── Template Browser ── */}
      {view === "templates" && !selectedTemplate && (
        <motion.div
          key="templates"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-4 pb-28"
        >
          {/* Header */}
          <section className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setView("choose-method")}>
              <ChevronLeft size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold tracking-normal text-foreground">Program Library</h1>
              <p className="text-xs text-zinc-500">{filteredTemplates.length} programs available</p>
            </div>
          </section>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={60}
              className="w-full rounded-xl border border-input-border bg-input py-2.5 pl-9 pr-8 text-sm text-foreground placeholder:text-zinc-500 outline-none transition focus:border-violet-500/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-950 dark:hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {templateCategories.map((cat) => (
              <CategoryPill
                key={cat.id}
                label={cat.label}
                active={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
              />
            ))}
          </div>

          {/* Advanced filters */}
          <Surface className="space-y-3 p-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Refine Results</p>
            <div className="flex flex-wrap gap-2">
              {/* Experience filter */}
              {(["beginner", "intermediate", "advanced"] as const).map((exp) => (
                <button
                  key={exp}
                  onClick={() => setFilterExperience(filterExperience === exp ? null : exp)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all capitalize ${
                    filterExperience === exp
                      ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                      : "border-white/10 bg-transparent text-zinc-500 hover:border-white/20"
                  }`}
                >
                  <User size={8} className="inline mr-1 mb-px" />
                  {exp}
                </button>
              ))}

              <div className="w-px h-5 bg-white/10 self-center mx-1" />

              {/* Days filter */}
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => setFilterDays(filterDays === d ? null : d)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    filterDays === d
                      ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                      : "border-white/10 bg-transparent text-zinc-500 hover:border-white/20"
                  }`}
                >
                  {d}×/wk
                </button>
              ))}

              <div className="w-px h-5 bg-white/10 self-center mx-1" />

              {/* Duration filter */}
              {[30, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterDuration(filterDuration === m ? null : m)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    filterDuration === m
                      ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                      : "border-white/10 bg-transparent text-zinc-500 hover:border-white/20"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {(filterExperience || filterDays || filterDuration) && (
              <button
                onClick={() => { setFilterExperience(null); setFilterDays(null); setFilterDuration(null); }}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <X size={10} /> Clear filters
              </button>
            )}
          </Surface>

          {/* Template grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isRecommended={isRecommendedForProfile(template)}
                  onClick={() => { setSelectedTemplate(template); }}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 flex flex-col items-center gap-3 text-center">
              <Search size={32} className="text-zinc-600" />
              <p className="text-sm text-zinc-400">No programs match your filters.</p>
              <p className="text-xs text-zinc-600">Try adjusting your search or filter criteria.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setFilterExperience(null);
                  setFilterDays(null);
                  setFilterDuration(null);
                }}
              >
                Reset All
              </Button>
            </Card>
          )}
        </motion.div>
      )}

      {/* ── Template Detail ── */}
      {view === "templates" && selectedTemplate && (
        <TemplateDetailView
          key="detail"
          template={selectedTemplate}
          onBack={() => setSelectedTemplate(null)}
          onUseTemplate={() => {
            setPendingTemplate(selectedTemplate);
            setStartDayTarget("template");
            setSelectedStartDay("Monday");
            setShowStartDayModal(true);
          }}
        />
      )}

      {/* ── Manual Form ── */}
      {view === "manual-form" && (
        <motion.div
          key="manual"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-4 pb-28"
        >
          <section className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => editingWorkoutPlanId ? setActiveSubScreen(null) : setView("choose-method")}>
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-xl font-semibold tracking-normal text-foreground">
                {editingWorkoutPlanId ? "Edit Plan" : "New Plan"}
              </h1>
            </div>
            <Button onClick={handleSave} className="gap-1.5">
              <Check size={14} />
              Save
            </Button>
          </section>

          {plan.routines.length > 0 && (
            <Card className="p-3 flex items-center gap-2 border border-emerald-500/15 dark:border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
              <Sparkles size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Pre-populated from template with {plan.routines.length} routines &amp; {plan.routines.reduce((sum, r) => sum + r.exercises.length, 0)} exercises.
              </p>
            </Card>
          )}

          {error && (
            <Card className="p-4 border border-rose-500/15 dark:border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
              {error}
            </Card>
          )}

          <Card className="p-4">
            <Label>Plan Name</Label>
            <Input
              value={plan.name}
              maxLength={40}
              onChange={(e) => setPlan({ ...plan, name: e.target.value })}
            />
          </Card>

          <Card className="p-4">
            <Label>Start Day of Week</Label>
            <select
              value={plan.startDay || "Monday"}
              onChange={(e) => setPlan({ ...plan, startDay: e.target.value as any })}
              className="mt-2 block w-full rounded-xl border border-input-border bg-input px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </Card>

          <Card className="p-4">
            <Label>Goal</Label>
            <Input
              value={plan.goal}
              maxLength={120}
              placeholder="e.g., Build strength, lose fat, improve conditioning"
              onChange={(e) => setPlan({ ...plan, goal: e.target.value })}
            />
          </Card>

          {/* Seeding Split Templates Card */}
          <Card className="p-4 space-y-3">
            <div>
              <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
                <span>Seed Split Templates</span>
              </Label>
              <p className="text-xs text-zinc-500 mt-1 leading-normal">
                Instantly populate your routines and exercises with pre-configured split programs. Perfect for speeding up manual planning.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs py-2.5 h-auto bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20 flex flex-col gap-0.5 justify-center items-center rounded-xl"
                onClick={() => handleSeedSplit("ppl")}
              >
                <span className="font-bold">Push / Pull / Legs</span>
                <span className="text-xs text-zinc-500 font-medium">3-Day Classic Split</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs py-2.5 h-auto bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex flex-col gap-0.5 justify-center items-center rounded-xl"
                onClick={() => handleSeedSplit("upper-lower")}
              >
                <span className="font-bold">Upper / Lower</span>
                <span className="text-xs text-zinc-500 font-medium">4-Day Muscle Split</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs py-2.5 h-auto bg-sky-500/10 border-sky-500/20 text-sky-300 hover:bg-sky-500/20 flex flex-col gap-0.5 justify-center items-center rounded-xl"
                onClick={() => handleSeedSplit("full-body")}
              >
                <span className="font-bold">Full Body</span>
                <span className="text-xs text-zinc-500 font-medium">3-Day Alternating Plan</span>
              </Button>
            </div>
          </Card>

          {/* Routines preview */}
          {plan.routines.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Routines ({plan.routines.length})
              </h2>
              {plan.routines.map((routine, idx) => (
                <Card key={routine.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{routine.name}</h3>
                        <p className="text-xs text-zinc-500">{routine.focus} · {routine.day}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500">{routine.exercises.length} exercises</span>
                  </div>

                  <div className="space-y-1">
                    {routine.exercises.map((ex, exIdx) => {
                      const data = getExerciseById(ex.exerciseId);
                      return (
                        <div key={exIdx} className="flex items-center justify-between px-2 py-1 rounded bg-zinc-50 dark:bg-white/[0.02]">
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">{data?.name ?? ex.exerciseId}</span>
                          <span className="text-xs text-zinc-650 dark:text-zinc-600 tabular-nums">{ex.targetSets}×{ex.targetReps}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {showStartDayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-6 space-y-4 relative border border-card-border shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <Button variant="ghost" size="icon" className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5" onClick={() => {
              setShowStartDayModal(false);
              setPendingTemplate(null);
              setPendingAiData(null);
              setStartDayTarget(null);
            }}>
              <X size={20} />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">Select Start Day</h2>
            <p className="text-zinc-650 dark:text-zinc-300 text-sm leading-relaxed">
              Choose the start day of the week for your new plan. Your routines will be scheduled starting from this day.
            </p>
            <div className="space-y-2">
              <Label>Start Day</Label>
              <select
                value={selectedStartDay}
                onChange={(e) => setSelectedStartDay(e.target.value)}
                className="w-full rounded-xl border border-input-border bg-input px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => {
                setShowStartDayModal(false);
                setPendingTemplate(null);
                setPendingAiData(null);
                setStartDayTarget(null);
              }} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmStartDay} className="flex-1">
                Confirm &amp; Create
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─── AI PLAN GENERATION ERROR MODAL ─── */}
      {showAiErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 supports-[backdrop-filter]:backdrop-blur-md">
          <Card className="w-full max-w-md p-6 space-y-4 relative border border-rose-500/30 bg-card shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              onClick={() => setShowAiErrorModal(false)}
            >
              <X size={20} />
            </Button>

            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="shrink-0 h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
                <AlertTriangle className="text-rose-500 dark:text-rose-400" size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">AI Coach</p>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-snug mt-0.5">Plan Generation Failed</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Something went wrong while your AI Coach was building your plan.</p>
              </div>
            </div>

            {/* Error detail */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] dark:bg-rose-500/[0.07] p-3.5 space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400">Error Detail</p>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono break-words">
                {aiErrorMessage || "An unknown error occurred communicating with the AI provider."}
              </p>
            </div>

            {/* Tips */}
            <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Common causes:</p>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>Invalid or expired API key</li>
                <li>No active AI provider configured</li>
                <li>Network connection issue or provider outage</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                onClick={() => setShowAiErrorModal(false)}
                className="flex-1 text-xs font-bold"
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowAiErrorModal(false);
                  setActiveSubScreen(null);
                  setActiveTab("settings");
                  setActiveSettingsTab?.("ai");
                }}
                className="flex-1 text-xs font-bold"
              >
                <Settings size={14} className="mr-1.5" />
                Check AI Settings
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}