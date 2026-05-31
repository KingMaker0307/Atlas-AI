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
  | "treadmill"
  | "elliptical"
  | "stationary-bike"
  | "stairclimber"
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
  injuries?: string;
  workoutDuration?: number;
  gender?: "male" | "female";
  activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active";
  email?: string;
  emailVerified?: boolean;
  capturedProvider?: "google" | "apple" | "email" | null;
}

export interface Exercise {
  id: string;
  name: string;
  category: "compound" | "isolation" | "cardio" | "steady-state" | "mobility";
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
  // Cardio-specific fields (optional — used for cardio/steady-state exercises)
  durationSeconds?: number;
  distance?: number;
  pace?: string;
  incline?: number;
  resistance?: number;
  calories?: number;
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
  skipped?: boolean;
  weightUnit?: WeightUnit; // Per-exercise unit override, persisted with workout
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
  planId?: string | null;
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
  creatorType?: "manual" | "template" | "ai";
  startDay?: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  notes?: string;
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
  activeWorkout: Workout | null;
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
  guidedMode?: boolean;
  restTimerEndsAt?: string;
  updatedAt: string;
  apiCallCount: number; // Added to AtlasSnapshot
  tokenCount: number; // Added to AtlasSnapshot
  deviceSecret?: string;
  nutritionEntries?: NutritionEntry[];
  waterLogs?: WaterLogEntry[];
}

export interface NutritionEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;   // g
  carbs: number;     // g
  fat: number;       // g
  fiber: number;     // g
  sugar: number;     // g
  sodium: number;    // mg
  potassium: number; // mg
  vitaminC: number;  // mg
  calcium: number;   // mg
  iron: number;      // mg
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  servingSize: number;
  servingUnit: string;
  timestamp: string;
}

export interface WaterLogEntry {
  id: string;
  amount: number;    // ml
  timestamp: string;
}