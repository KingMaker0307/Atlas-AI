"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BatteryCharging,
  Flame,
  Medal,
  Moon,
  TimerReset,
  Pencil,
  Sparkles,
  Plus,
  Bot,
  Trash2,
  X,
  User,
  Calendar,
  Weight,
  Ruler,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import {
  calculateRecoveryScore,
  getBodyweightSeries,
  getCurrentStreak,
  getFatigueLabel,
  getRecentPrs,
  getVolumeSeries,
  getWeeklyVolume,
} from "@/lib/progression/engine";
import { useAtlasStore } from "@/store/useAtlasStore";
import { parseAiWorkoutPlan } from "@/lib/ai/parser";
import { useState, type FC } from "react";
import type { UserProfile } from "@/types/domain";

interface AiPromptCardProps {
  profile: UserProfile;
  onCancel: () => void;
  onGenerate: (data: { targetDate: string; additionalDetails: string }) => void;
  isBusy: boolean;
}

const AiPromptCard: FC<AiPromptCardProps> = ({ profile, onCancel, onGenerate, isBusy }) => {
  const [targetDate, setTargetDate] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = () => {
    if (!targetDate) {
      setError("Please select a target date.");
      return;
    }
    setError(null);
    onGenerate({ targetDate, additionalDetails });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="w-full max-w-md"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Generate AI Plan</h2>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X size={20} />
            </Button>
          </div>

          <div className="mb-4 space-y-3">
            <h3 className="text-base font-medium text-white">Your Profile Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <Surface className="p-3 flex items-center gap-3">
                <User size={18} className="text-zinc-400" />
                <span className="text-sm">{profile.name}</span>
              </Surface>
              <Surface className="p-3 flex items-center gap-3">
                <Sparkles size={18} className="text-zinc-400" />
                <span className="text-sm">{profile.age} years</span>
              </Surface>
              <Surface className="p-3 flex items-center gap-3">
                <Weight size={18} className="text-zinc-400" />
                <span className="text-sm">
                  {profile.weight} {profile.weightUnit}
                </span>
              </Surface>
              <Surface className="p-3 flex items-center gap-3">
                <Ruler size={18} className="text-zinc-400" />
                <span className="text-sm">
                  {profile.height} {profile.heightUnit}
                </span>
              </Surface>
            </div>
          </div>

          <div className="mb-4">
            <Label>Target Date</Label>
            <Input
              type="date"
              min={minDate}
              className="mt-2"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label>Additional Details for AI</Label>
            <Textarea
              className="mt-2 h-24 resize-none"
              placeholder="e.g., 'I have a shoulder injury', 'I want to focus on legs', 'I only have dumbbells'"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-medium mb-4">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isBusy}>
              <Sparkles size={16} className="mr-2" />
              {isBusy ? "Generating..." : "Generate Plan"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export function DashboardScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const workouts = useAtlasStore((state) => state.workouts);
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const bodyMetrics = useAtlasStore((state) => state.bodyMetrics);
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const sendCoachMessage = useAtlasStore((state) => state.sendCoachMessage);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const setEditingWorkoutPlanId = useAtlasStore((state) => state.setEditingWorkoutPlanId);
  const deleteWorkoutPlan = useAtlasStore((state) => state.deleteWorkoutPlan);

  const [showAiCard, setShowAiCard] = useState(false);

  const recoveryScore = calculateRecoveryScore(recoveryLogs.at(-1));
  const fatigue = getFatigueLabel(recoveryScore);
  const bodySeries = getBodyweightSeries(bodyMetrics);
  const volumeSeries = getVolumeSeries(workouts);
  const recentPrs = getRecentPrs(workouts);
  
  const lastMessage = aiMessages.at(-1);
  const isLastMessageError = lastMessage?.content.includes("**Error:**");

  const handleGeneratePlan = async ({ targetDate, additionalDetails }: { targetDate: string; additionalDetails: string }) => {
    setShowAiCard(false);
    if (!profile) return;

    const { experience, bodyType, age, height, weight, heightUnit, weightUnit, trainingStyle, daysPerWeek, goal } = profile;
    const prompt = `Generate a personalized workout plan for me.
    
    My Profile:
    - Experience: ${experience}
    - Body Type: ${bodyType}
    - Age: ${age}
    - Height: ${height} ${heightUnit}
    - Weight: ${weight} ${weightUnit}
    - Primary Goal: ${goal}
    - Training Style: ${trainingStyle}
    - Days Per Week: ${daysPerWeek}
    
    My Target Date to achieve this goal is: ${targetDate}.
    
    Additional Details: ${additionalDetails || "None"}

    Respond with ONLY a JSON object in the following format:
    {
      "id": "string",
      "name": "string",
      "goal": "string",
      "targetDate": "string",
      "routines": [
        {
          "id": "string",
          "name": "string",
          "focus": "string",
          "estimatedMinutes": "number",
          "day": "string",
          "exercises": [
            {
              "exerciseId": "string",
              "targetSets": "number",
              "targetReps": "string",
              "restSeconds": "number"
            }
          ]
        }
      ]
    }`;
    
    const displayedContent = additionalDetails 
      ? `Generate a new workout plan for me with the following additional details: ${additionalDetails}`
      : `Generate a new workout plan for me based on my profile.`;
      
    await sendCoachMessage(prompt, { isRoutineGeneration: true, displayedContent });
  };

  const isWorkoutPlan = (content: string) => {
    return parseAiWorkoutPlan(content) !== null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-28 relative"
    >
      <AnimatePresence>
        {showAiCard && profile && (
          <AiPromptCard
            profile={profile}
            onCancel={() => setShowAiCard(false)}
            onGenerate={handleGeneratePlan}
            isBusy={coachBusy}
          />
        )}
      </AnimatePresence>

      <section>
        <p className="text-sm text-zinc-400">Welcome back, {profile?.name ?? "Athlete"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Today’s coach read</h1>
      </section>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Biometrics</h2>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab("settings")}>
            <Pencil size={16} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard label="Age" value={`${profile?.age ?? "N/A"}`} detail="years" />
          <MetricCard label="Weight" value={`${profile?.weight ?? "N/A"} ${profile?.weightUnit}`} />
          <MetricCard label="Height" value={`${profile?.height ?? "N/A"} ${profile?.heightUnit}`} />
          <MetricCard label="Target" value={profile?.targetPhysique ?? "N/A"} />
        </div>
        {profile?.dietaryPreferences && (
          <div className="mt-3">
            <h3 className="text-sm font-medium text-zinc-400">Dietary Preferences</h3>
            <p className="text-sm text-white">{profile.dietaryPreferences}</p>
          </div>
        )}
      </Card>

      {workoutPlans.length === 0 ? (
        <Card className="p-4">
          <div className="text-center">
            {coachBusy ? (
               <div className="py-6 flex flex-col items-center">
                 <Bot className="mx-auto h-12 w-12 text-emerald-300 animate-pulse" />
                 <h2 className="mt-4 text-xl font-semibold text-white">Coach is working...</h2>
                 <p className="mt-2 text-sm text-zinc-400">Generating your personalized workout plan.</p>
               </div>
            ) : (
              <>
                <Sparkles className="mx-auto h-12 w-12 text-emerald-300" />
                <h2 className="mt-4 text-xl font-semibold text-white">No workout plan found</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Generate a personalized workout plan with AI or create one manually.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="primary" onClick={() => setShowAiCard(true)}>
                    Generate with AI
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    setEditingWorkoutPlanId(null);
                    setActiveSubScreen("workout-plan-builder");
                  }}>
                    Create Manually
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      ) : (
        workoutPlans.map(plan => (
          <Card className="overflow-hidden p-4" key={plan.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="mt-2 text-2xl font-semibold text-white">{plan.name}</h2>
                <p className="mt-1 max-w-[18rem] text-sm leading-6 text-zinc-400">{plan.goal}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => {
                  setEditingWorkoutPlanId(plan.id);
                  setActiveSubScreen("workout-plan-builder");
                }}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteWorkoutPlan(plan.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <Button className="mt-4 w-full" variant="primary" onClick={() => {
              setEditingWorkoutPlanId(plan.id);
              setActiveSubScreen("workout-plan-detail");
            }}>
              View Plan
            </Button>
          </Card>
        ))
      )}

      {workoutPlans.length > 0 && (
        <Card className="p-4">
          {coachBusy ? (
            <div className="py-2 flex flex-col items-center">
              <Bot className="h-6 w-6 text-emerald-300 animate-pulse mb-2" />
              <p className="text-sm font-medium text-white">Coach is generating a new plan...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" onClick={() => setShowAiCard(true)}>
                <Sparkles className="mr-2" size={16} />
                AI Generate
              </Button>
              <Button variant="secondary" onClick={() => {
                setEditingWorkoutPlanId(null);
                setActiveSubScreen("workout-plan-builder");
              }}>
                <Plus className="mr-2" size={16} />
                Create Manual
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Streak"
          value={`${getCurrentStreak(workouts)}d`}
          detail="training days"
          icon={<Flame size={18} />}
          tone="amber"
        />
        <MetricCard
          label="Volume"
          value={Math.round(getWeeklyVolume(workouts)).toLocaleString()}
          detail="this week"
          icon={<Activity size={18} />}
          tone="sky"
        />
        <MetricCard
          label="Fatigue"
          value={fatigue.label}
          detail="auto adjusted"
          icon={<BatteryCharging size={18} />}
          tone={fatigue.tone === "good" ? "emerald" : fatigue.tone === "warn" ? "amber" : "rose"}
        />
        <MetricCard
          label="Sleep"
          value={`${recoveryLogs.at(-1)?.sleepHours ?? 7.2}h`}
          detail="last log"
          icon={<Moon size={18} />}
          tone="violet"
        />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Trendline</h2>
            <p className="text-sm text-zinc-500">Bodyweight and training volume</p>
          </div>
          <TimerReset className="text-zinc-500" size={18} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Surface className="h-44 flex flex-col">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Bodyweight</p>
            {bodySeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                <AreaChart data={bodySeries}>
                  <defs>
                    <linearGradient id="bodyweight" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                  <Area type="monotone" dataKey="weight" stroke="#6ee7b7" fill="url(#bodyweight)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center pb-8 text-sm text-zinc-500">
                Not enough data
              </div>
            )}
          </Surface>
          <Surface className="h-44 flex flex-col">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Weekly volume</p>
            {volumeSeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                <AreaChart data={volumeSeries}>
                  <defs>
                    <linearGradient id="volume" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                  <Area type="monotone" dataKey="volume" stroke="#38bdf8" fill="url(#volume)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center pb-8 text-sm text-zinc-500">
                Not enough data
              </div>
            )}
          </Surface>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent PRs</h2>
          <Medal className="text-amber-200" size={18} />
        </div>
        <div className="mt-3 space-y-2">
          {recentPrs.map((pr) => (
            <Surface key={`${pr.exerciseName}-${pr.value}`} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium text-white">{pr.exerciseName}</p>
                <p className="text-xs text-zinc-500">{pr.date}</p>
              </div>
              <p className="text-sm font-semibold text-amber-100">{pr.value}</p>
            </Surface>
          ))}
        </div>
      </Card>

      <Card className={`p-4 ${isLastMessageError ? 'bg-red-900/20 border-red-300/20' : 'bg-emerald-900/20 border-emerald-300/20'}`}>
        <div className="flex items-start gap-4">
          <Bot className={isLastMessageError ? 'text-red-300' : 'text-emerald-300'} size={24} />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">
              {isLastMessageError ? "Coach Connection Error" : "Coach's Note"}
            </h2>
            <p className={`mt-2 text-sm leading-6 ${isLastMessageError ? 'text-red-300' : 'text-zinc-300'}`}>
              {lastMessage && isWorkoutPlan(lastMessage.content)
                ? "I've generated a new workout plan for you. Check it out on your dashboard."
                : lastMessage?.content}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => setActiveTab("coach")}
              icon={<ArrowUpRight size={16} />}
            >
              Ask Coach
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}