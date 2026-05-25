import type { TrainingStyle, Physique, EquipmentPreference, Routine } from "@/types/domain";
import { createId } from "@/lib/id";

// ─── Template Types ──────────────────────────────────────────

export interface RoutineTemplate {
  name: string;
  focus: string;
  estimatedMinutes: number;
  exercises: {
    exerciseId: string;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
  }[];
}

export interface PlanTemplate {
  id: string;
  name: string;
  origin: string;
  description: string;
  trainingStyles: TrainingStyle[];
  experience: ("beginner" | "intermediate" | "advanced")[];
  equipment: EquipmentPreference[];
  daysPerWeek: number[];
  durationMinutes: number;
  targetPhysiques: Physique[];
  tags: string[];
  routines: RoutineTemplate[];
}

// ─── Filter / Ranking ────────────────────────────────────────

export interface TemplateFilters {
  trainingStyle?: TrainingStyle;
  experience?: "beginner" | "intermediate" | "advanced";
  equipment?: EquipmentPreference;
  daysPerWeek?: number;
  durationMinutes?: number;
  searchQuery?: string;
}

export function scoreTemplate(template: PlanTemplate, filters: TemplateFilters): number {
  let score = 0;
  if (filters.trainingStyle && template.trainingStyles.includes(filters.trainingStyle)) score += 30;
  if (filters.experience && template.experience.includes(filters.experience)) score += 25;
  if (filters.equipment && template.equipment.includes(filters.equipment)) score += 25;
  if (filters.daysPerWeek && template.daysPerWeek.includes(filters.daysPerWeek)) score += 10;
  if (filters.durationMinutes && Math.abs(template.durationMinutes - filters.durationMinutes) <= 15) score += 10;
  return score;
}

export function filterAndRankTemplates(templates: PlanTemplate[], filters: TemplateFilters): PlanTemplate[] {
  let filtered = templates;

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  // Hard-filter by equipment if specified
  if (filters.equipment) {
    filtered = filtered.filter((t) => t.equipment.includes(filters.equipment!));
  }

  // Sort by score descending
  return filtered
    .map((t) => ({ template: t, score: scoreTemplate(t, filters) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.template);
}

export function templateToRoutines(template: PlanTemplate): Routine[] {
  return template.routines.map((rt, i) => ({
    id: createId("routine"),
    name: rt.name,
    focus: rt.focus,
    estimatedMinutes: rt.estimatedMinutes,
    day: `Day ${i + 1}`,
    exercises: rt.exercises.map((ex) => ({ ...ex })),
  }));
}

// ─── Template Categories ─────────────────────────────────────

export const templateCategories = [
  { id: "all", label: "All Programs" },
  { id: "strength", label: "Strength" },
  { id: "hypertrophy", label: "Hypertrophy" },
  { id: "powerbuilding", label: "Powerbuilding" },
  { id: "endurance", label: "Endurance & HIIT" },
  { id: "bodyweight", label: "Bodyweight" },
  { id: "home", label: "Home / Dumbbell" },
  { id: "beginner", label: "Beginner Friendly" },
] as const;

export function getTemplatesByCategory(categoryId: string): PlanTemplate[] {
  if (categoryId === "all") return planTemplates;
  if (categoryId === "strength") return planTemplates.filter((t) => t.trainingStyles.includes("strength"));
  if (categoryId === "hypertrophy") return planTemplates.filter((t) => t.trainingStyles.includes("hypertrophy"));
  if (categoryId === "powerbuilding") return planTemplates.filter((t) => t.trainingStyles.includes("powerbuilding"));
  if (categoryId === "endurance") return planTemplates.filter((t) => t.trainingStyles.includes("endurance") || t.tags.includes("HIIT"));
  if (categoryId === "bodyweight") return planTemplates.filter((t) => t.equipment.includes("bodyweight"));
  if (categoryId === "home") return planTemplates.filter((t) => t.equipment.includes("home gym"));
  if (categoryId === "beginner") return planTemplates.filter((t) => t.experience.includes("beginner"));
  return planTemplates;
}

// ─── TEMPLATE LIBRARY ────────────────────────────────────────

export const planTemplates: PlanTemplate[] = [
  // ═══════════════════════════════════════════════════════════
  // STRENGTH PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "starting-strength",
    name: "Starting Strength",
    origin: "Mark Rippetoe",
    description: "The gold-standard novice barbell program. Alternates two workouts across 3 days with linear progression on compound lifts.",
    trainingStyles: ["strength"],
    experience: ["beginner"],
    equipment: ["full gym"],
    daysPerWeek: [3],
    durationMinutes: 60,
    targetPhysiques: ["athletic", "bulky"],
    tags: ["barbell", "linear progression", "novice", "compound", "classic"],
    routines: [
      {
        name: "Workout A",
        focus: "Squat / Bench / Deadlift",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "5", restSeconds: 180 },
          { exerciseId: "bench-press", targetSets: 3, targetReps: "5", restSeconds: 180 },
          { exerciseId: "deadlift", targetSets: 1, targetReps: "5", restSeconds: 300 },
        ],
      },
      {
        name: "Workout B",
        focus: "Squat / OHP / Deadlift",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "5", restSeconds: 180 },
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "5", restSeconds: 180 },
          { exerciseId: "deadlift", targetSets: 1, targetReps: "5", restSeconds: 300 },
        ],
      },
    ],
  },
  {
    id: "stronglifts-5x5",
    name: "StrongLifts 5×5",
    origin: "Mehdi Hadim",
    description: "Simple 3-day program focused on five barbell exercises with 5×5 sets and linear weight increases each session.",
    trainingStyles: ["strength"],
    experience: ["beginner"],
    equipment: ["full gym"],
    daysPerWeek: [3],
    durationMinutes: 45,
    targetPhysiques: ["athletic", "bulky"],
    tags: ["barbell", "5x5", "novice", "linear progression", "simple"],
    routines: [
      {
        name: "Workout A",
        focus: "Squat / Bench / Row",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 5, targetReps: "5", restSeconds: 180 },
          { exerciseId: "bench-press", targetSets: 5, targetReps: "5", restSeconds: 180 },
          { exerciseId: "barbell-row", targetSets: 5, targetReps: "5", restSeconds: 180 },
        ],
      },
      {
        name: "Workout B",
        focus: "Squat / OHP / Deadlift",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 5, targetReps: "5", restSeconds: 180 },
          { exerciseId: "overhead-press", targetSets: 5, targetReps: "5", restSeconds: 180 },
          { exerciseId: "deadlift", targetSets: 1, targetReps: "5", restSeconds: 300 },
        ],
      },
    ],
  },
  {
    id: "greyskull-lp",
    name: "Greyskull LP",
    origin: "John Sheaffer",
    description: "Beginner linear progression that adds AMRAP final sets for autoregulation and includes chin-ups and curls for balanced development.",
    trainingStyles: ["strength", "powerbuilding"],
    experience: ["beginner"],
    equipment: ["full gym"],
    daysPerWeek: [3],
    durationMinutes: 60,
    targetPhysiques: ["athletic", "lean"],
    tags: ["barbell", "AMRAP", "LP", "novice", "autoregulation"],
    routines: [
      {
        name: "Workout A",
        focus: "OHP / Chin-ups / Squat",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "5+", restSeconds: 180 },
          { exerciseId: "chin-up", targetSets: 3, targetReps: "6-8", restSeconds: 120 },
          { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "5+", restSeconds: 180 },
        ],
      },
      {
        name: "Workout B",
        focus: "Bench / Row / Deadlift",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "bench-press", targetSets: 3, targetReps: "5+", restSeconds: 180 },
          { exerciseId: "barbell-row", targetSets: 3, targetReps: "6-8", restSeconds: 120 },
          { exerciseId: "deadlift", targetSets: 3, targetReps: "5+", restSeconds: 180 },
        ],
      },
    ],
  },
  {
    id: "wendler-531",
    name: "5/3/1 Wendler",
    origin: "Jim Wendler",
    description: "Proven intermediate strength program with monthly periodization. Each session focuses on one main lift with assistance work.",
    trainingStyles: ["strength", "powerbuilding"],
    experience: ["intermediate", "advanced"],
    equipment: ["full gym"],
    daysPerWeek: [4],
    durationMinutes: 60,
    targetPhysiques: ["athletic", "bulky"],
    tags: ["barbell", "periodization", "531", "monthly cycles", "proven"],
    routines: [
      {
        name: "Squat Day",
        focus: "Squat + Assistance",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "5/3/1+", restSeconds: 240 },
          { exerciseId: "leg-press", targetSets: 5, targetReps: "10", restSeconds: 90 },
          { exerciseId: "leg-curl", targetSets: 4, targetReps: "12", restSeconds: 60 },
          { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Bench Day",
        focus: "Bench + Assistance",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "bench-press", targetSets: 3, targetReps: "5/3/1+", restSeconds: 240 },
          { exerciseId: "dumbbell-row", targetSets: 5, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dip", targetSets: 5, targetReps: "10", restSeconds: 90 },
          { exerciseId: "face-pull", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Deadlift Day",
        focus: "Deadlift + Assistance",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "deadlift", targetSets: 3, targetReps: "5/3/1+", restSeconds: 240 },
          { exerciseId: "front-squat", targetSets: 3, targetReps: "8", restSeconds: 120 },
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "plank", targetSets: 3, targetReps: "60s", restSeconds: 60 },
        ],
      },
      {
        name: "OHP Day",
        focus: "Overhead Press + Assistance",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "5/3/1+", restSeconds: 240 },
          { exerciseId: "lat-pulldown", targetSets: 5, targetReps: "10", restSeconds: 90 },
          { exerciseId: "lateral-raise", targetSets: 4, targetReps: "12", restSeconds: 60 },
          { exerciseId: "dumbbell-curl", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "texas-method",
    name: "Texas Method",
    origin: "Mark Rippetoe / Glenn Pendlay",
    description: "Intermediate 3-day program: Monday is high volume, Wednesday is recovery, Friday is intensity with new PRs.",
    trainingStyles: ["strength"],
    experience: ["intermediate"],
    equipment: ["full gym"],
    daysPerWeek: [3],
    durationMinutes: 75,
    targetPhysiques: ["athletic", "bulky"],
    tags: ["barbell", "volume/intensity", "intermediate", "weekly progression"],
    routines: [
      {
        name: "Volume Day",
        focus: "High Volume Compounds",
        estimatedMinutes: 75,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 5, targetReps: "5", restSeconds: 240 },
          { exerciseId: "bench-press", targetSets: 5, targetReps: "5", restSeconds: 180 },
          { exerciseId: "deadlift", targetSets: 1, targetReps: "5", restSeconds: 300 },
        ],
      },
      {
        name: "Recovery Day",
        focus: "Light Active Recovery",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 2, targetReps: "5", restSeconds: 120 },
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "5", restSeconds: 120 },
          { exerciseId: "chin-up", targetSets: 3, targetReps: "8", restSeconds: 90 },
        ],
      },
      {
        name: "Intensity Day",
        focus: "Heavy Singles/Triples",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 1, targetReps: "5", restSeconds: 300 },
          { exerciseId: "bench-press", targetSets: 1, targetReps: "5", restSeconds: 300 },
          { exerciseId: "deadlift", targetSets: 1, targetReps: "5", restSeconds: 300 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // HYPERTROPHY PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "ppl-6day",
    name: "Push / Pull / Legs (6-Day)",
    origin: "Classic Bodybuilding",
    description: "The most popular bodybuilding split. Each muscle group is hit twice per week with dedicated push, pull, and leg days.",
    trainingStyles: ["hypertrophy", "powerbuilding"],
    experience: ["intermediate", "advanced"],
    equipment: ["full gym"],
    daysPerWeek: [6],
    durationMinutes: 60,
    targetPhysiques: ["athletic", "bulky", "shredded"],
    tags: ["PPL", "bodybuilding", "high frequency", "6-day split"],
    routines: [
      {
        name: "Push A",
        focus: "Chest / Shoulders / Triceps",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "bench-press", targetSets: 4, targetReps: "6-8", restSeconds: 150 },
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "8-10", restSeconds: 90 },
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "8-10", restSeconds: 120 },
          { exerciseId: "lateral-raise", targetSets: 4, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "tricep-pushdown", targetSets: 3, targetReps: "10-12", restSeconds: 60 },
          { exerciseId: "dumbbell-tricep-extension", targetSets: 3, targetReps: "10-12", restSeconds: 60 },
        ],
      },
      {
        name: "Pull A",
        focus: "Back / Biceps / Rear Delts",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-row", targetSets: 4, targetReps: "6-8", restSeconds: 150 },
          { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "8-10", restSeconds: 90 },
          { exerciseId: "cable-row", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "face-pull", targetSets: 4, targetReps: "15-20", restSeconds: 60 },
          { exerciseId: "barbell-curl", targetSets: 3, targetReps: "8-10", restSeconds: 60 },
          { exerciseId: "hammer-curl", targetSets: 3, targetReps: "10-12", restSeconds: 60 },
        ],
      },
      {
        name: "Legs A",
        focus: "Quads / Hams / Glutes / Calves",
        estimatedMinutes: 65,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 4, targetReps: "6-8", restSeconds: 180 },
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "8-10", restSeconds: 120 },
          { exerciseId: "leg-press", targetSets: 3, targetReps: "10-12", restSeconds: 120 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "leg-extension", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "calf-raise-machine", targetSets: 4, targetReps: "12-15", restSeconds: 60 },
        ],
      },
      {
        name: "Push B",
        focus: "Chest / Shoulders / Triceps",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "incline-bench-press", targetSets: 4, targetReps: "6-8", restSeconds: 150 },
          { exerciseId: "dumbbell-bench-press", targetSets: 3, targetReps: "8-10", restSeconds: 90 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "8-10", restSeconds: 120 },
          { exerciseId: "cable-fly", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "lateral-raise", targetSets: 4, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "dip", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
        ],
      },
      {
        name: "Pull B",
        focus: "Back / Biceps / Rear Delts",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "pull-up", targetSets: 4, targetReps: "6-10", restSeconds: 120 },
          { exerciseId: "dumbbell-row", targetSets: 3, targetReps: "8-10", restSeconds: 90 },
          { exerciseId: "cable-row", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "face-pull", targetSets: 4, targetReps: "15-20", restSeconds: 60 },
          { exerciseId: "dumbbell-curl", targetSets: 3, targetReps: "10-12", restSeconds: 60 },
          { exerciseId: "hammer-curl", targetSets: 3, targetReps: "10-12", restSeconds: 60 },
        ],
      },
      {
        name: "Legs B",
        focus: "Quads / Hams / Glutes / Calves",
        estimatedMinutes: 65,
        exercises: [
          { exerciseId: "front-squat", targetSets: 4, targetReps: "6-8", restSeconds: 180 },
          { exerciseId: "deadlift", targetSets: 3, targetReps: "5", restSeconds: 180 },
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "hip-thrust", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "calf-raise-machine", targetSets: 4, targetReps: "15-20", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "ppl-3day",
    name: "Push / Pull / Legs (3-Day)",
    origin: "Classic Bodybuilding",
    description: "A condensed version of PPL for those who can only train 3 days per week. Each muscle group is hit once per week.",
    trainingStyles: ["hypertrophy"],
    experience: ["intermediate"],
    equipment: ["full gym"],
    daysPerWeek: [3],
    durationMinutes: 60,
    targetPhysiques: ["athletic", "toned"],
    tags: ["PPL", "bodybuilding", "3-day"],
    routines: [
      {
        name: "Push",
        focus: "Chest / Shoulders / Triceps",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "bench-press", targetSets: 4, targetReps: "8", restSeconds: 150 },
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "lateral-raise", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "tricep-pushdown", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "Pull",
        focus: "Back / Biceps",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-row", targetSets: 4, targetReps: "8", restSeconds: 150 },
          { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "cable-row", targetSets: 3, targetReps: "12", restSeconds: 90 },
          { exerciseId: "face-pull", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "barbell-curl", targetSets: 3, targetReps: "10", restSeconds: 60 },
        ],
      },
      {
        name: "Legs",
        focus: "Quads / Hams / Glutes / Calves",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 4, targetReps: "8", restSeconds: 180 },
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "leg-press", targetSets: 3, targetReps: "12", restSeconds: 90 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "calf-raise-machine", targetSets: 4, targetReps: "15", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "upper-lower-4day",
    name: "Upper / Lower Split",
    origin: "Classic Training",
    description: "A balanced 4-day split alternating upper-body and lower-body days. Each muscle group trained twice per week.",
    trainingStyles: ["hypertrophy", "powerbuilding"],
    experience: ["intermediate"],
    equipment: ["full gym"],
    daysPerWeek: [4],
    durationMinutes: 60,
    targetPhysiques: ["athletic", "toned", "lean"],
    tags: ["upper/lower", "4-day", "balanced", "intermediate"],
    routines: [
      {
        name: "Upper A (Strength)",
        focus: "Upper Body Compounds",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "bench-press", targetSets: 4, targetReps: "5-6", restSeconds: 180 },
          { exerciseId: "barbell-row", targetSets: 4, targetReps: "5-6", restSeconds: 150 },
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "8", restSeconds: 120 },
          { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "8-10", restSeconds: 90 },
          { exerciseId: "barbell-curl", targetSets: 2, targetReps: "10", restSeconds: 60 },
          { exerciseId: "tricep-pushdown", targetSets: 2, targetReps: "10", restSeconds: 60 },
        ],
      },
      {
        name: "Lower A (Strength)",
        focus: "Lower Body Compounds",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 4, targetReps: "5-6", restSeconds: 240 },
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "8", restSeconds: 150 },
          { exerciseId: "leg-press", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "calf-raise-machine", targetSets: 4, targetReps: "12", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "45s", restSeconds: 60 },
        ],
      },
      {
        name: "Upper B (Volume)",
        focus: "Upper Body Volume",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "cable-row", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "dumbbell-fly", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "lateral-raise", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "face-pull", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Lower B (Volume)",
        focus: "Lower Body Volume",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "front-squat", targetSets: 3, targetReps: "8-10", restSeconds: 150 },
          { exerciseId: "deadlift", targetSets: 3, targetReps: "5", restSeconds: 240 },
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "leg-extension", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "bro-split-5day",
    name: "Classic Bro Split (5-Day)",
    origin: "Golden-Era Bodybuilding",
    description: "Dedicated day for each muscle group. Very popular for maximizing volume per body part with full weekly recovery.",
    trainingStyles: ["hypertrophy"],
    experience: ["intermediate", "advanced"],
    equipment: ["full gym"],
    daysPerWeek: [5],
    durationMinutes: 60,
    targetPhysiques: ["bulky", "shredded", "athletic"],
    tags: ["bro split", "bodybuilding", "5-day", "high volume per muscle"],
    routines: [
      {
        name: "Chest",
        focus: "Chest Isolation & Compounds",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "bench-press", targetSets: 4, targetReps: "8", restSeconds: 150 },
          { exerciseId: "incline-dumbbell-press", targetSets: 4, targetReps: "10", restSeconds: 90 },
          { exerciseId: "cable-fly", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "dumbbell-fly", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "dip", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
        ],
      },
      {
        name: "Back",
        focus: "Back Width & Thickness",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-row", targetSets: 4, targetReps: "8", restSeconds: 150 },
          { exerciseId: "lat-pulldown", targetSets: 4, targetReps: "10", restSeconds: 90 },
          { exerciseId: "cable-row", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-row", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "pull-up", targetSets: 3, targetReps: "max", restSeconds: 120 },
        ],
      },
      {
        name: "Shoulders",
        focus: "All Three Delt Heads",
        estimatedMinutes: 55,
        exercises: [
          { exerciseId: "overhead-press", targetSets: 4, targetReps: "8", restSeconds: 150 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "lateral-raise", targetSets: 4, targetReps: "15", restSeconds: 60 },
          { exerciseId: "face-pull", targetSets: 4, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Legs",
        focus: "Quads / Hams / Glutes / Calves",
        estimatedMinutes: 70,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 4, targetReps: "8", restSeconds: 180 },
          { exerciseId: "leg-press", targetSets: 4, targetReps: "10", restSeconds: 120 },
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "leg-extension", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "calf-raise-machine", targetSets: 4, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Arms",
        focus: "Biceps & Triceps",
        estimatedMinutes: 50,
        exercises: [
          { exerciseId: "barbell-curl", targetSets: 4, targetReps: "10", restSeconds: 90 },
          { exerciseId: "close-grip-bench-press", targetSets: 4, targetReps: "8", restSeconds: 120 },
          { exerciseId: "dumbbell-curl", targetSets: 3, targetReps: "10", restSeconds: 60 },
          { exerciseId: "tricep-pushdown", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "hammer-curl", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "dumbbell-tricep-extension", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "gvt",
    name: "German Volume Training",
    origin: "Charles Poliquin",
    description: "10 sets of 10 reps on major compound lifts. Extreme volume approach for rapid hypertrophy with moderate weight.",
    trainingStyles: ["hypertrophy"],
    experience: ["intermediate", "advanced"],
    equipment: ["full gym"],
    daysPerWeek: [4],
    durationMinutes: 60,
    targetPhysiques: ["bulky", "athletic"],
    tags: ["10x10", "high volume", "extreme", "GVT", "size"],
    routines: [
      {
        name: "Chest & Back",
        focus: "10×10 Antagonist Pairing",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "bench-press", targetSets: 10, targetReps: "10", restSeconds: 90 },
          { exerciseId: "barbell-row", targetSets: 10, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-fly", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "Legs",
        focus: "10×10 Squats",
        estimatedMinutes: 65,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 10, targetReps: "10", restSeconds: 90 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "calf-raise-machine", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Shoulders & Arms",
        focus: "10×10 OHP + Arms",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "overhead-press", targetSets: 10, targetReps: "10", restSeconds: 90 },
          { exerciseId: "barbell-curl", targetSets: 3, targetReps: "10", restSeconds: 60 },
          { exerciseId: "tricep-pushdown", targetSets: 3, targetReps: "10", restSeconds: 60 },
        ],
      },
      {
        name: "Back & Hamstrings",
        focus: "10×10 Deadlift Variant",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "romanian-deadlift", targetSets: 10, targetReps: "10", restSeconds: 90 },
          { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "face-pull", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // POWERBUILDING PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "phul",
    name: "PHUL (Power Hypertrophy Upper Lower)",
    origin: "Brandon Campbell",
    description: "4-day program combining heavy power days with higher-rep hypertrophy days for balanced strength and size gains.",
    trainingStyles: ["powerbuilding", "strength", "hypertrophy"],
    experience: ["intermediate"],
    equipment: ["full gym"],
    daysPerWeek: [4],
    durationMinutes: 60,
    targetPhysiques: ["athletic", "bulky"],
    tags: ["PHUL", "power", "hypertrophy", "4-day", "balanced"],
    routines: [
      {
        name: "Upper Power",
        focus: "Heavy Upper Compounds",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "bench-press", targetSets: 4, targetReps: "3-5", restSeconds: 240 },
          { exerciseId: "barbell-row", targetSets: 4, targetReps: "3-5", restSeconds: 180 },
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "5-8", restSeconds: 150 },
          { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "6-10", restSeconds: 120 },
          { exerciseId: "barbell-curl", targetSets: 2, targetReps: "6-10", restSeconds: 60 },
        ],
      },
      {
        name: "Lower Power",
        focus: "Heavy Lower Compounds",
        estimatedMinutes: 65,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 4, targetReps: "3-5", restSeconds: 300 },
          { exerciseId: "deadlift", targetSets: 3, targetReps: "3-5", restSeconds: 300 },
          { exerciseId: "leg-press", targetSets: 3, targetReps: "10-15", restSeconds: 120 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "6-10", restSeconds: 90 },
          { exerciseId: "calf-raise-machine", targetSets: 4, targetReps: "6-10", restSeconds: 60 },
        ],
      },
      {
        name: "Upper Hypertrophy",
        focus: "Upper Body Volume",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "cable-row", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "cable-fly", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "lateral-raise", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "dumbbell-curl", targetSets: 3, targetReps: "8-12", restSeconds: 60 },
          { exerciseId: "tricep-pushdown", targetSets: 3, targetReps: "8-12", restSeconds: 60 },
        ],
      },
      {
        name: "Lower Hypertrophy",
        focus: "Lower Body Volume",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "front-squat", targetSets: 3, targetReps: "8-12", restSeconds: 150 },
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "8-12", restSeconds: 120 },
          { exerciseId: "leg-press", targetSets: 3, targetReps: "12-15", restSeconds: 90 },
          { exerciseId: "leg-extension", targetSets: 3, targetReps: "10-15", restSeconds: 60 },
          { exerciseId: "leg-curl", targetSets: 3, targetReps: "10-15", restSeconds: 60 },
          { exerciseId: "calf-raise-machine", targetSets: 4, targetReps: "12-15", restSeconds: 60 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // GENERAL / FULL BODY
  // ═══════════════════════════════════════════════════════════
  {
    id: "full-body-3day",
    name: "Full Body 3×/Week",
    origin: "General Training",
    description: "Train every major muscle group 3 times per week. Ideal for beginners or busy schedules wanting maximum efficiency.",
    trainingStyles: ["general", "strength"],
    experience: ["beginner", "intermediate"],
    equipment: ["full gym"],
    daysPerWeek: [3],
    durationMinutes: 60,
    targetPhysiques: ["athletic", "toned", "lean"],
    tags: ["full body", "3-day", "efficient", "balanced", "beginner friendly"],
    routines: [
      {
        name: "Full Body A",
        focus: "Squat Focus + Upper",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "8", restSeconds: 150 },
          { exerciseId: "bench-press", targetSets: 3, targetReps: "8", restSeconds: 150 },
          { exerciseId: "barbell-row", targetSets: 3, targetReps: "8", restSeconds: 120 },
          { exerciseId: "dumbbell-curl", targetSets: 2, targetReps: "12", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "45s", restSeconds: 60 },
        ],
      },
      {
        name: "Full Body B",
        focus: "Deadlift Focus + Upper",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "deadlift", targetSets: 3, targetReps: "5", restSeconds: 180 },
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "8", restSeconds: 150 },
          { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-lunge", targetSets: 2, targetReps: "10", restSeconds: 90 },
          { exerciseId: "face-pull", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Full Body C",
        focus: "Front Squat Focus + Upper",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "front-squat", targetSets: 3, targetReps: "8", restSeconds: 150 },
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "cable-row", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "lateral-raise", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "tricep-pushdown", targetSets: 2, targetReps: "12", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "full-body-2day",
    name: "Full Body 2×/Week",
    origin: "Minimalist Training",
    description: "For the absolute busiest schedules. Hit every muscle group twice per week in just 2 sessions.",
    trainingStyles: ["general"],
    experience: ["beginner"],
    equipment: ["full gym", "home gym"],
    daysPerWeek: [2],
    durationMinutes: 60,
    targetPhysiques: ["toned", "lean"],
    tags: ["full body", "2-day", "minimalist", "busy schedule"],
    routines: [
      {
        name: "Session A",
        focus: "Full Body Push Emphasis",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "8", restSeconds: 180 },
          { exerciseId: "bench-press", targetSets: 3, targetReps: "8", restSeconds: 150 },
          { exerciseId: "barbell-row", targetSets: 3, targetReps: "8", restSeconds: 120 },
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "plank", targetSets: 3, targetReps: "45s", restSeconds: 60 },
        ],
      },
      {
        name: "Session B",
        focus: "Full Body Pull Emphasis",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "deadlift", targetSets: 3, targetReps: "5", restSeconds: 240 },
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "face-pull", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // BODYWEIGHT PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "bwf-recommended",
    name: "Bodyweight Fitness Recommended Routine",
    origin: "Reddit BWF Community",
    description: "The internet's most popular bodyweight program. Progressive pairs of push/pull/legs movements done 3 times per week.",
    trainingStyles: ["general", "strength"],
    experience: ["beginner", "intermediate"],
    equipment: ["bodyweight"],
    daysPerWeek: [3],
    durationMinutes: 60,
    targetPhysiques: ["lean", "athletic", "toned"],
    tags: ["bodyweight", "calisthenics", "no equipment", "RR", "progressive"],
    routines: [
      {
        name: "Full Body A",
        focus: "Push / Pull / Legs Pairs",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "pull-up", targetSets: 3, targetReps: "5-8", restSeconds: 90 },
          { exerciseId: "push-up", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "inverted-row", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "dip", targetSets: 3, targetReps: "5-8", restSeconds: 90 },
          { exerciseId: "bodyweight-squat", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "glute-bridge", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "30s", restSeconds: 60 },
        ],
      },
      {
        name: "Full Body B",
        focus: "Push / Pull / Legs Pairs",
        estimatedMinutes: 60,
        exercises: [
          { exerciseId: "chin-up", targetSets: 3, targetReps: "5-8", restSeconds: 90 },
          { exerciseId: "diamond-push-up", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "inverted-row", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "pike-push-up", targetSets: 3, targetReps: "5-8", restSeconds: 90 },
          { exerciseId: "lunge", targetSets: 3, targetReps: "10", restSeconds: 60 },
          { exerciseId: "glute-bridge", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "8", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "calisthenics-ppl",
    name: "Calisthenics PPL Split",
    origin: "Calisthenics Community",
    description: "A push/pull/legs structure using only bodyweight. Great for intermediate athletes who want more volume than a full-body program.",
    trainingStyles: ["hypertrophy", "general"],
    experience: ["intermediate", "advanced"],
    equipment: ["bodyweight"],
    daysPerWeek: [3, 4, 6],
    durationMinutes: 45,
    targetPhysiques: ["lean", "athletic", "toned"],
    tags: ["bodyweight", "calisthenics", "PPL", "no equipment"],
    routines: [
      {
        name: "Push",
        focus: "Chest / Shoulders / Triceps",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "push-up", targetSets: 4, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "diamond-push-up", targetSets: 3, targetReps: "8-12", restSeconds: 60 },
          { exerciseId: "pike-push-up", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "dip", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "plank", targetSets: 3, targetReps: "45s", restSeconds: 60 },
        ],
      },
      {
        name: "Pull",
        focus: "Back / Biceps",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "pull-up", targetSets: 4, targetReps: "5-10", restSeconds: 120 },
          { exerciseId: "chin-up", targetSets: 3, targetReps: "6-10", restSeconds: 90 },
          { exerciseId: "inverted-row", targetSets: 3, targetReps: "10-15", restSeconds: 60 },
          { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "10", restSeconds: 60 },
        ],
      },
      {
        name: "Legs",
        focus: "Quads / Hams / Glutes",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "bodyweight-squat", targetSets: 4, targetReps: "15-20", restSeconds: 60 },
          { exerciseId: "lunge", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "glute-bridge", targetSets: 4, targetReps: "15", restSeconds: 60 },
          { exerciseId: "mountain-climber", targetSets: 3, targetReps: "20", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "60s", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "minimalist-bodyweight",
    name: "Minimalist Bodyweight",
    origin: "General Fitness",
    description: "Just 3 sessions per week, 30 minutes each. The bare minimum effective dose for maintaining fitness with zero equipment.",
    trainingStyles: ["general", "endurance"],
    experience: ["beginner"],
    equipment: ["bodyweight"],
    daysPerWeek: [3],
    durationMinutes: 30,
    targetPhysiques: ["toned", "lean"],
    tags: ["bodyweight", "minimalist", "30 min", "beginner", "no equipment"],
    routines: [
      {
        name: "Express A",
        focus: "Upper + Core",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "push-up", targetSets: 3, targetReps: "10-15", restSeconds: 45 },
          { exerciseId: "inverted-row", targetSets: 3, targetReps: "8-12", restSeconds: 45 },
          { exerciseId: "pike-push-up", targetSets: 3, targetReps: "5-10", restSeconds: 45 },
          { exerciseId: "plank", targetSets: 3, targetReps: "30s", restSeconds: 30 },
        ],
      },
      {
        name: "Express B",
        focus: "Lower + Conditioning",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "bodyweight-squat", targetSets: 3, targetReps: "15-20", restSeconds: 45 },
          { exerciseId: "lunge", targetSets: 3, targetReps: "10", restSeconds: 45 },
          { exerciseId: "glute-bridge", targetSets: 3, targetReps: "15", restSeconds: 45 },
          { exerciseId: "mountain-climber", targetSets: 3, targetReps: "20", restSeconds: 30 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // HOME GYM / DUMBBELL PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "dumbbell-full-body-3day",
    name: "Dumbbell Only Full Body (3-Day)",
    origin: "Home Training",
    description: "Complete full-body training using only dumbbells. Perfect for home gyms with adjustable dumbbells and a bench.",
    trainingStyles: ["general", "hypertrophy"],
    experience: ["beginner", "intermediate"],
    equipment: ["home gym"],
    daysPerWeek: [3],
    durationMinutes: 45,
    targetPhysiques: ["toned", "athletic", "lean"],
    tags: ["dumbbell", "home gym", "3-day", "full body", "no barbell"],
    routines: [
      {
        name: "Full Body A",
        focus: "Push Emphasis",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "goblet-squat", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-bench-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-row", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-curl", targetSets: 2, targetReps: "12", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "30s", restSeconds: 45 },
        ],
      },
      {
        name: "Full Body B",
        focus: "Pull Emphasis",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-row", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "lateral-raise", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "hammer-curl", targetSets: 2, targetReps: "12", restSeconds: 60 },
          { exerciseId: "dumbbell-tricep-extension", targetSets: 2, targetReps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "Full Body C",
        focus: "Hinge Emphasis",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "dumbbell-bench-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-row", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "goblet-squat", targetSets: 3, targetReps: "12", restSeconds: 90 },
          { exerciseId: "dumbbell-fly", targetSets: 2, targetReps: "12", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "45s", restSeconds: 45 },
        ],
      },
    ],
  },
  {
    id: "dumbbell-ppl",
    name: "Dumbbell Only PPL",
    origin: "Home Training",
    description: "Push/Pull/Legs split using only dumbbells. Can be run 3 or 6 days per week depending on recovery.",
    trainingStyles: ["hypertrophy"],
    experience: ["intermediate"],
    equipment: ["home gym"],
    daysPerWeek: [3, 6],
    durationMinutes: 45,
    targetPhysiques: ["athletic", "toned"],
    tags: ["dumbbell", "PPL", "home gym", "no barbell"],
    routines: [
      {
        name: "Push",
        focus: "Chest / Shoulders / Triceps",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "dumbbell-bench-press", targetSets: 4, targetReps: "8-10", restSeconds: 90 },
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "lateral-raise", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "dumbbell-fly", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "dumbbell-tricep-extension", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "Pull",
        focus: "Back / Biceps",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "dumbbell-row", targetSets: 4, targetReps: "8-10", restSeconds: 90 },
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "dumbbell-curl", targetSets: 3, targetReps: "10", restSeconds: 60 },
          { exerciseId: "hammer-curl", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "Legs",
        focus: "Quads / Hams / Glutes",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "goblet-squat", targetSets: 4, targetReps: "10-12", restSeconds: 90 },
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "glute-bridge", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "45s", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "dumbbell-upper-lower",
    name: "Dumbbell Upper / Lower",
    origin: "Home Training",
    description: "4-day upper/lower split using only dumbbells. Great balance of frequency and volume for home gyms.",
    trainingStyles: ["hypertrophy", "general"],
    experience: ["intermediate"],
    equipment: ["home gym"],
    daysPerWeek: [4],
    durationMinutes: 45,
    targetPhysiques: ["athletic", "toned"],
    tags: ["dumbbell", "upper/lower", "home gym", "4-day"],
    routines: [
      {
        name: "Upper A",
        focus: "Push Emphasis",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "dumbbell-bench-press", targetSets: 4, targetReps: "8", restSeconds: 90 },
          { exerciseId: "dumbbell-row", targetSets: 4, targetReps: "8", restSeconds: 90 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "lateral-raise", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "dumbbell-curl", targetSets: 2, targetReps: "12", restSeconds: 60 },
          { exerciseId: "dumbbell-tricep-extension", targetSets: 2, targetReps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "Lower A",
        focus: "Squat Emphasis",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "goblet-squat", targetSets: 4, targetReps: "10", restSeconds: 90 },
          { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "glute-bridge", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "45s", restSeconds: 60 },
        ],
      },
      {
        name: "Upper B",
        focus: "Pull Emphasis",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-row", targetSets: 4, targetReps: "10", restSeconds: 90 },
          { exerciseId: "dumbbell-fly", targetSets: 3, targetReps: "12", restSeconds: 60 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "hammer-curl", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "Lower B",
        focus: "Hinge Emphasis",
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: "romanian-deadlift", targetSets: 4, targetReps: "8", restSeconds: 120 },
          { exerciseId: "goblet-squat", targetSets: 3, targetReps: "12", restSeconds: 90 },
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "10", restSeconds: 90 },
          { exerciseId: "glute-bridge", targetSets: 3, targetReps: "15", restSeconds: 60 },
          { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "10", restSeconds: 60 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // ENDURANCE / HIIT / CONDITIONING
  // ═══════════════════════════════════════════════════════════
  {
    id: "hiit-circuit",
    name: "HIIT Circuit Training",
    origin: "Functional Fitness",
    description: "High-intensity interval circuits alternating between strength and cardio movements. Burns fat and builds work capacity.",
    trainingStyles: ["endurance", "general"],
    experience: ["beginner", "intermediate"],
    equipment: ["bodyweight", "home gym", "full gym"],
    daysPerWeek: [3, 4],
    durationMinutes: 30,
    targetPhysiques: ["lean", "toned", "shredded"],
    tags: ["HIIT", "circuit", "fat loss", "conditioning", "cardio"],
    routines: [
      {
        name: "Circuit A",
        focus: "Upper + Cardio",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "push-up", targetSets: 4, targetReps: "12", restSeconds: 30 },
          { exerciseId: "mountain-climber", targetSets: 4, targetReps: "20", restSeconds: 30 },
          { exerciseId: "burpee", targetSets: 4, targetReps: "8", restSeconds: 30 },
          { exerciseId: "inverted-row", targetSets: 4, targetReps: "10", restSeconds: 30 },
          { exerciseId: "plank", targetSets: 3, targetReps: "30s", restSeconds: 30 },
        ],
      },
      {
        name: "Circuit B",
        focus: "Lower + Cardio",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "bodyweight-squat", targetSets: 4, targetReps: "15", restSeconds: 30 },
          { exerciseId: "lunge", targetSets: 4, targetReps: "10", restSeconds: 30 },
          { exerciseId: "glute-bridge", targetSets: 4, targetReps: "15", restSeconds: 30 },
          { exerciseId: "burpee", targetSets: 4, targetReps: "8", restSeconds: 30 },
          { exerciseId: "mountain-climber", targetSets: 3, targetReps: "20", restSeconds: 30 },
        ],
      },
      {
        name: "Circuit C",
        focus: "Full Body Blast",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "burpee", targetSets: 5, targetReps: "8", restSeconds: 30 },
          { exerciseId: "push-up", targetSets: 4, targetReps: "10", restSeconds: 20 },
          { exerciseId: "bodyweight-squat", targetSets: 4, targetReps: "15", restSeconds: 20 },
          { exerciseId: "mountain-climber", targetSets: 4, targetReps: "20", restSeconds: 20 },
          { exerciseId: "plank", targetSets: 3, targetReps: "30s", restSeconds: 30 },
        ],
      },
    ],
  },
  {
    id: "kettlebell-conditioning",
    name: "Kettlebell Conditioning",
    origin: "Kettlebell Sport / StrongFirst",
    description: "Swing-centric conditioning program blending power development and metabolic training with minimal equipment.",
    trainingStyles: ["endurance", "general", "strength"],
    experience: ["intermediate"],
    equipment: ["home gym"],
    daysPerWeek: [3],
    durationMinutes: 30,
    targetPhysiques: ["lean", "athletic", "toned"],
    tags: ["kettlebell", "conditioning", "swings", "home gym", "metabolic"],
    routines: [
      {
        name: "Swing Day",
        focus: "Hip Power + Core",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "kettlebell-swing", targetSets: 10, targetReps: "15", restSeconds: 30 },
          { exerciseId: "goblet-squat", targetSets: 3, targetReps: "10", restSeconds: 60 },
          { exerciseId: "plank", targetSets: 3, targetReps: "45s", restSeconds: 45 },
        ],
      },
      {
        name: "Strength Day",
        focus: "Upper Body + Swings",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "8", restSeconds: 90 },
          { exerciseId: "dumbbell-row", targetSets: 3, targetReps: "8", restSeconds: 90 },
          { exerciseId: "kettlebell-swing", targetSets: 5, targetReps: "15", restSeconds: 30 },
          { exerciseId: "push-up", targetSets: 3, targetReps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "Metabolic Day",
        focus: "Timed Circuits",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "kettlebell-swing", targetSets: 5, targetReps: "20", restSeconds: 30 },
          { exerciseId: "goblet-squat", targetSets: 4, targetReps: "12", restSeconds: 30 },
          { exerciseId: "push-up", targetSets: 4, targetReps: "10", restSeconds: 30 },
          { exerciseId: "mountain-climber", targetSets: 4, targetReps: "20", restSeconds: 30 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // EXPRESS / SHORT DURATION (30 min)
  // ═══════════════════════════════════════════════════════════
  {
    id: "express-strength-30",
    name: "Express Strength (30 min)",
    origin: "Time-Efficient Training",
    description: "Get the big 3 compound lifts done in 30 minutes. No fluff, maximum efficiency for busy strength athletes.",
    trainingStyles: ["strength"],
    experience: ["intermediate", "advanced"],
    equipment: ["full gym"],
    daysPerWeek: [3],
    durationMinutes: 30,
    targetPhysiques: ["athletic", "bulky"],
    tags: ["30 min", "express", "strength", "efficient", "compound"],
    routines: [
      {
        name: "Squat + Push",
        focus: "Squat & Bench",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "5", restSeconds: 180 },
          { exerciseId: "bench-press", targetSets: 3, targetReps: "5", restSeconds: 180 },
        ],
      },
      {
        name: "Hinge + Pull",
        focus: "Deadlift & Row",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "deadlift", targetSets: 3, targetReps: "5", restSeconds: 240 },
          { exerciseId: "barbell-row", targetSets: 3, targetReps: "8", restSeconds: 120 },
        ],
      },
      {
        name: "Press + Squat",
        focus: "OHP & Front Squat",
        estimatedMinutes: 30,
        exercises: [
          { exerciseId: "overhead-press", targetSets: 3, targetReps: "5", restSeconds: 180 },
          { exerciseId: "front-squat", targetSets: 3, targetReps: "8", restSeconds: 150 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // EXTENDED / 90-MIN PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "phat-5day",
    name: "PHAT (Power Hypertrophy Adaptive Training)",
    origin: "Dr. Layne Norton",
    description: "Advanced 5-day program blending 2 power days and 3 hypertrophy days for maximum strength and size gains.",
    trainingStyles: ["powerbuilding", "hypertrophy"],
    experience: ["advanced"],
    equipment: ["full gym"],
    daysPerWeek: [5],
    durationMinutes: 90,
    targetPhysiques: ["bulky", "athletic", "shredded"],
    tags: ["PHAT", "advanced", "power + hypertrophy", "5-day", "Layne Norton"],
    routines: [
      {
        name: "Upper Power",
        focus: "Heavy Upper",
        estimatedMinutes: 75,
        exercises: [
          { exerciseId: "barbell-row", targetSets: 3, targetReps: "3-5", restSeconds: 240 },
          { exerciseId: "bench-press", targetSets: 3, targetReps: "3-5", restSeconds: 240 },
          { exerciseId: "lat-pulldown", targetSets: 2, targetReps: "6-10", restSeconds: 120 },
          { exerciseId: "overhead-press", targetSets: 2, targetReps: "6-10", restSeconds: 120 },
          { exerciseId: "barbell-curl", targetSets: 3, targetReps: "6-10", restSeconds: 90 },
          { exerciseId: "tricep-pushdown", targetSets: 3, targetReps: "6-10", restSeconds: 90 },
        ],
      },
      {
        name: "Lower Power",
        focus: "Heavy Lower",
        estimatedMinutes: 75,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "3-5", restSeconds: 300 },
          { exerciseId: "deadlift", targetSets: 2, targetReps: "3-5", restSeconds: 300 },
          { exerciseId: "leg-press", targetSets: 2, targetReps: "6-10", restSeconds: 150 },
          { exerciseId: "leg-curl", targetSets: 2, targetReps: "6-10", restSeconds: 90 },
          { exerciseId: "calf-raise-machine", targetSets: 3, targetReps: "6-10", restSeconds: 60 },
        ],
      },
      {
        name: "Back & Shoulders Hypertrophy",
        focus: "High Volume Back",
        estimatedMinutes: 90,
        exercises: [
          { exerciseId: "barbell-row", targetSets: 6, targetReps: "3-5", restSeconds: 60 },
          { exerciseId: "cable-row", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "dumbbell-row", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "lat-pulldown", targetSets: 2, targetReps: "15-20", restSeconds: 60 },
          { exerciseId: "dumbbell-shoulder-press", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "lateral-raise", targetSets: 3, targetReps: "12-20", restSeconds: 60 },
        ],
      },
      {
        name: "Lower Hypertrophy",
        focus: "High Volume Legs",
        estimatedMinutes: 90,
        exercises: [
          { exerciseId: "barbell-back-squat", targetSets: 6, targetReps: "3-5", restSeconds: 60 },
          { exerciseId: "front-squat", targetSets: 3, targetReps: "8-12", restSeconds: 120 },
          { exerciseId: "dumbbell-lunge", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "leg-extension", targetSets: 2, targetReps: "15-20", restSeconds: 60 },
          { exerciseId: "leg-curl", targetSets: 2, targetReps: "15-20", restSeconds: 60 },
          { exerciseId: "calf-raise-machine", targetSets: 3, targetReps: "10-15", restSeconds: 60 },
        ],
      },
      {
        name: "Chest & Arms Hypertrophy",
        focus: "High Volume Chest + Arms",
        estimatedMinutes: 90,
        exercises: [
          { exerciseId: "bench-press", targetSets: 6, targetReps: "3-5", restSeconds: 60 },
          { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "cable-fly", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "barbell-curl", targetSets: 3, targetReps: "8-12", restSeconds: 60 },
          { exerciseId: "hammer-curl", targetSets: 2, targetReps: "12-15", restSeconds: 60 },
          { exerciseId: "close-grip-bench-press", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
          { exerciseId: "dumbbell-tricep-extension", targetSets: 2, targetReps: "12-15", restSeconds: 60 },
        ],
      },
    ],
  },
];
