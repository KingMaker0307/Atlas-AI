export type ThemeMode = "dark" | "light" | "system";
export type WeightUnit = "lbs" | "kg";
export type HeightUnit = "in" | "cm";
export type TrainingStyle =
  | "strength"
  | "hypertrophy"
  | "powerbuilding"
  | "endurance"
  | "general";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "full body";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "cardio"
  | "other";

export type BodyType = "ectomorph" | "mesomorph" | "endomorph";
export type EquipmentPreference = "full gym" | "home gym" | "bodyweight";
export type Physique = "lean" | "athletic" | "bulky" | "shredded" | "toned";

export interface UserProfile {
  id: string;
  name: string;
  goal: string;
  experience: "beginner" | "intermediate" | "advanced";
  trainingStyle: TrainingStyle;
  daysPerWeek: number;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  createdAt: string;
  age?: number;
  height?: number;
  weight?: number;
  targetPhysique?: Physique;
  dietaryPreferences?: string;
  bodyType?: BodyType;
  equipment?: EquipmentPreference;
  customGoal?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: "compound" | "isolation" | "cardio" | "mobility";
  muscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: "beginner" | "intermediate" | "advanced";
  instructions: string[];
  setup: string[];
  execution: string[];
  breathing: string;
  tempo: string;
  commonMistakes: string[];
  safetyTips: string[];
  progressionTips: string[];
  imageUrl?: string;
  videoUrl?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  rir?: number;
  rpe?: number;
  completed: boolean;
  isDropSet?: boolean;
  note?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  supersetGroup?: string;
  notes?: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  notes?: string;
  fatigueRating?: number;
}

export interface Routine {
  id: string;
  name: string;
  focus: string;
  estimatedMinutes: number;
  day: string;
  exercises: Array<{
    exerciseId: string;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
  }>;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  goal: string;
  targetDate?: string;
  routines: Routine[];
}

export interface RecoveryLog {
  id: string;
  date: string;
  sleepHours: number;
  soreness: number;
  stress: number;
  readiness: number;
  energy: number;
  note?: string;
}

export interface BodyMetric {
  id: string;
  date: string;
  bodyweight?: number;
  waist?: number;
  bodyFat?: number;
  chest?: number;
  hips?: number;
  arm?: number;
  thigh?: number;
  photo?: string;
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface EncryptedSecret {
  iv: string;
  data: string;
}

export interface AiProviderSettings {
  id: string;
  type:
    | "openai"
    | "anthropic"
    | "gemini"
    | "grok"
    | "deepseek"
    | "ollama"
    | "lmstudio"
    | "openrouter"
    | "custom";
  label: string;
  baseUrl?: string;
  model: string;
  apiKey?: EncryptedSecret;
  temperature: number;
  contextLength: number;
  streaming: boolean;
  enabled: boolean;
  lastTestedAt?: string;
  lastStatus?: "ok" | "error";
  lastError?: string;
}

export interface ProgressionRecommendation {
  exerciseId: string;
  exerciseName: string;
  action: "increase_weight" | "hold" | "deload" | "reduce_volume";
  reason: string;
  suggestedWeightDelta?: number;
  suggestedVolumeDelta?: number;
}

export interface AtlasSnapshot {
  profile: UserProfile | null;
  workouts: Workout[];
  activeWorkout?: Workout | null;
  recoveryLogs: RecoveryLog[];
  bodyMetrics: BodyMetric[];
  aiMessages: AiMessage[];
  aiProviders: AiProviderSettings[];
  activeProviderId?: string;
  workoutPlans: WorkoutPlan[];
  theme: ThemeMode;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  hasOnboarded: boolean;
  restTimerEndsAt?: string;
  updatedAt: string;
}