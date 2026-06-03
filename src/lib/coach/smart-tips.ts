import type { UserProfile, Workout, RecoveryLog, MuscleGroup } from "@/types/domain";
import { getExerciseById as getStaticExerciseById } from "@/data/exercises";
import { calculateRecoveryScore, getCurrentStreak, getTrainingConsistency } from "@/lib/progression/engine";

export interface SmartTip {
  title: string;
  desc: string;
  type: "info" | "warning" | "success" | "tip";
}

export function getSmartTips(
  profile: UserProfile | null,
  workouts: Workout[],
  recoveryLogs: RecoveryLog[],
  guidedMode: boolean,
  storeExercises: any[] = []
): SmartTip[] {
  const tips: SmartTip[] = [];

  const getExerciseById = (id: string) => {
    const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return (
      storeExercises.find((e) => {
        const eNorm = e.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return e.id === id || eNorm === normId || e.name.trim().toLowerCase() === id.trim().toLowerCase();
      }) || getStaticExerciseById(id)
    );
  };

  // Filter workouts with completed sets
  const completedWorkouts = workouts.filter((w) =>
    w.exercises.some((ex) => ex.sets.some((s) => s.completed))
  );

  // 1. No workouts logged yet
  if (completedWorkouts.length === 0) {
    tips.push({
      title: "Start Your Journey",
      desc: "Log your first workout to unlock personalized, data-driven training tips and analysis.",
      type: "info",
    });
    // Add a basic guide tip based on mode
    if (guidedMode) {
      tips.push({
        title: "Beginner Tip: Focus on Habit",
        desc: "Don't worry about lifting heavy yet. Focus on building a routine of showing up 2-3 times per week.",
        type: "tip",
      });
    } else {
      tips.push({
        title: "Advanced Tip: CNS Baseline",
        desc: "Log your morning recovery state regularly so the system can map your neuromuscular readiness to training load.",
        type: "tip",
      });
    }
    return tips;
  }

  // 2. Streak & Consistency analysis
  const streak = getCurrentStreak(completedWorkouts, null);
  const targetDays = profile?.daysPerWeek || 3;
  const consistency = getTrainingConsistency(completedWorkouts, targetDays, null);

  if (streak >= 3) {
    tips.push({
      title: `${streak}-Session Streak!`,
      desc: `🔥 Excellent consistency. You're building strong physiological momentum. Keep showing up!`,
      type: "success",
    });
  } else if (consistency >= 80) {
    tips.push({
      title: "Superb Consistency",
      desc: `🎯 You are hitting ${consistency}% of your weekly workout goals. Consistency is the primary driver of muscle adaptation.`,
      type: "success",
    });
  } else if (consistency < 40) {
    tips.push({
      title: "Consistency Opportunity",
      desc: `Consistency is currently at ${consistency}%. Try planning your workouts on specific days (e.g., Mon/Wed/Fri) to build stable habits.`,
      type: "warning",
    });
  }

  // 3. Recovery check-in frequency
  const weekAgo = Date.now() - 7 * 86400000;
  const recentRecoveryLogs = recoveryLogs.filter(
    (log) => new Date(log.date).getTime() >= weekAgo
  );
  if (recentRecoveryLogs.length === 0) {
    tips.push({
      title: "Track Your Recovery",
      desc: "You haven't logged any daily check-ins this week. Adding sleep, soreness, and stress data allows the Coach to track fatigue.",
      type: "info",
    });
  }

  // 4. Volume and Muscle Balance analysis (Last 7 days)
  const muscleSets: Record<string, number> = {};
  completedWorkouts
    .filter((w) => new Date(w.startedAt).getTime() >= weekAgo)
    .forEach((w) => {
      w.exercises.forEach((ex) => {
        const detail = getExerciseById(ex.exerciseId);
        const muscles = detail?.muscles || [];
        const completedSetsCount = ex.sets.filter((s) => s.completed).length;
        if (completedSetsCount === 0) return;

        muscles.forEach((m: string) => {
          const key = m.toLowerCase();
          muscleSets[key] = (muscleSets[key] || 0) + completedSetsCount;
        });
      });
    });

  // Check high volume threshold
  let highVolumeMuscle = "";
  let highVolumeCount = 0;
  Object.entries(muscleSets).forEach(([muscle, count]) => {
    if (count > 22 && count > highVolumeCount) {
      highVolumeMuscle = muscle;
      highVolumeCount = count;
    }
  });

  if (highVolumeMuscle) {
    tips.push({
      title: `High Volume: ${highVolumeMuscle.charAt(0).toUpperCase() + highVolumeMuscle.slice(1)}`,
      desc: `You've logged ${highVolumeCount} sets for ${highVolumeMuscle} this week. Over 20 sets per muscle group can lead to junk volume and hinder recovery.`,
      type: "warning",
    });
  }

  // Check muscle imbalances
  const chestSets = muscleSets["chest"] || 0;
  const backSets = muscleSets["back"] || 0;
  if (chestSets >= 6 && chestSets > backSets * 2) {
    tips.push({
      title: "Push/Pull Imbalance",
      desc: `Your Chest volume (${chestSets} sets) is more than double your Back volume (${backSets} sets) this week. Balance push and pull to ensure posture health.`,
      type: "warning",
    });
  }

  const quadSets = muscleSets["quads"] || 0;
  const hamSets = muscleSets["hamstrings"] || 0;
  if (quadSets >= 6 && quadSets > hamSets * 2) {
    tips.push({
      title: "Anterior/Posterior Imbalance",
      desc: `Your Quads volume (${quadSets} sets) is more than double your Hamstrings volume (${hamSets} sets). Incorporate more hip-hinges (e.g. Deadlifts, RDLs) to protect knees.`,
      type: "warning",
    });
  }

  // 5. General / Mode Specific tips
  if (guidedMode) {
    tips.push({
      title: "Focus on Controlled Tempo",
      desc: "For muscle hypertrophy, perform the lowering (eccentric) phase under control (2-3 seconds) and lift (concentric) explosively.",
      type: "tip",
    });
    tips.push({
      title: "Rest for Performance",
      desc: "Rest 2 to 3 minutes between heavy multi-joint exercises (squats, chest press). Short rest decreases maximum force capacity.",
      type: "tip",
    });
  } else {
    // Advanced CNS integration tip
    const latestRecovery = recoveryLogs.at(-1);
    const score = calculateRecoveryScore(latestRecovery);
    if (score < 55) {
      tips.push({
        title: "CNS Autoregulated Deload",
        desc: `With recovery at ${score}%, manage fatigue by reducing load by 10% or leaving 2-3 Reps in Reserve (RIR) on compound exercises today.`,
        type: "warning",
      });
    } else {
      tips.push({
        title: "Maximize Progressive Overload",
        desc: "Strive to increase weight or reps on the first exercise of your session. Accumulate strength peaks systematically.",
        type: "tip",
      });
    }
  }

  return tips.slice(0, 3); // Return top 3 tips
}
