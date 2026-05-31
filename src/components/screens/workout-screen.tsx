"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  Clock3,
  Dumbbell,
  Flame,
  Layers3,
  Search,
  Timer,
  Trash2,
  Square,
  Plus,
  Minus,
  ClipboardList,
  Pencil,
  X,
  Shuffle,
  SkipForward,
  Info,
  Sparkles,
  Bot,
  Target,
  Heart,
  Footprints,
  Mic,
  MicOff,
  Upload,
  Scale,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select, Textarea }
  from "@/components/ui/input";
import { ExerciseDetail } from "@/components/exercise-detail";
import { exercises, getExerciseById as getStaticExerciseById } from "@/data/exercises";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Exercise, Routine } from "@/types/domain";
import { cn } from "@/lib/cn";
import { NutritionTracker } from "@/components/nutrition-tracker";
import { PreWorkoutCheckinModal } from "@/components/pre-workout-checkin-modal";
import { PostWorkoutCheckinModal } from "@/components/post-workout-checkin-modal";
import { FinishSessionModal } from "@/components/finish-session-modal";

const getExerciseStats = (workouts: any[], exerciseId: string, weightUnit: string) => {
  const completedWorkouts = workouts.filter((w) => w.completedAt);
  const allCompletedExs = completedWorkouts
    .flatMap((w) => w.exercises)
    .filter((ex) => ex.exerciseId === exerciseId);

  if (allCompletedExs.length === 0) return null;

  // Last lift is the most recent completed set log
  const lastExercise = allCompletedExs[allCompletedExs.length - 1];
  const lastLift = lastExercise.sets
    .filter((s: any) => s.completed)
    .map((s: any) => `${s.weight} ${weightUnit} x ${s.reps}`)
    .join(", ");

  // PR is the highest weight achieved
  let maxWeight = 0;
  for (const ex of allCompletedExs) {
    for (const s of ex.sets) {
      if (s.completed && s.weight > maxWeight) {
        maxWeight = s.weight;
      }
    }
  }

  return {
    last: lastLift || "No sets completed",
    pr: maxWeight > 0 ? `${maxWeight} ${weightUnit}` : "None"
  };
};

const WORD_TO_NUM: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10
};

function calculatePlates(targetWeight: number, unit: string) {
  const base = unit === "kg" ? 20 : 45;
  if (targetWeight <= base) return null;
  const targetPerSide = (targetWeight - base) / 2;
  const plates = unit === "kg" ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];

  const result: number[] = [];
  let remaining = targetPerSide;
  for (const plate of plates) {
    while (remaining >= plate - 0.01) {
      result.push(plate);
      remaining -= plate;
    }
  }
  return result;
}

function parseSpeechCommand(text: string) {
  const normalized = text.toLowerCase()
    .replace(/[,.:;\-_!?]/g, " ") // strip punctuation common in transcripts
    .replace(/\s+/g, " ")        // normalize multiple spaces
    .trim();

  // 1. Direct Command Matches
  if (normalized.includes("skip exercise") || normalized.includes("skip movement") || normalized.includes("skip this")) {
    return { command: "skip_exercise" };
  }
  if (normalized.includes("add set") || normalized.includes("new set") || normalized.includes("another set")) {
    return { command: "add_set" };
  }
  if (normalized.includes("start rest") || normalized.includes("rest now") || normalized.includes("start timer")) {
    return { command: "start_rest" };
  }
  if (normalized.includes("stop rest") || normalized.includes("stop timer") || normalized.includes("cancel rest")) {
    return { command: "stop_rest" };
  }

  // 2. Intelligent Weight, Reps, and Set Extraction
  let setNumber: number | null = null;
  let weight: number | null = null;
  let reps: number | null = null;

  // Extract set number (e.g., "set 2", "set two", "first set", "2nd set")
  const setMatch = normalized.match(/(?:log\s+)?set\s+(\w+)/i);
  if (setMatch) {
    const setWord = setMatch[1];
    const parsedSetNum = parseInt(setWord, 10);
    setNumber = !isNaN(parsedSetNum) ? parsedSetNum : (WORD_TO_NUM[setWord] || null);
  }

  if (setNumber === null) {
    // Try word-based matching for standalone words ("first", "second", "one", "two")
    for (const [word, num] of Object.entries(WORD_TO_NUM)) {
      if (normalized.includes(` ${word} `) || normalized.startsWith(`${word} `) || normalized.endsWith(` ${word}`)) {
        setNumber = num;
        break;
      }
    }
  }

  if (setNumber === null) {
    // Try ordinals like "1st", "2nd", "3rd", "4th"
    const ordMatch = normalized.match(/(\d+)(?:st|nd|rd|th)\s+set/i);
    if (ordMatch) {
      setNumber = parseInt(ordMatch[1], 10);
    }
  }

  // Extract weight/load (e.g. "135 pounds", "135 lbs", "135 kg", "weight 135", "load 135")
  const weightMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:pounds|libs|kilos|kg|lbs|weight|load)/i)
    || normalized.match(/(?:weight|load)\s+(\d+(?:\.\d+)?)/i);
  if (weightMatch) {
    weight = parseFloat(weightMatch[1]);
  }

  // Extract reps/rep/times (e.g. "8 reps", "8 rep", "8 times", "reps 8", "rep 8")
  const repsMatch = normalized.match(/(\d+)\s*(?:reps|rep|times)/i)
    || normalized.match(/(?:reps|rep)\s+(\d+)/i);
  if (repsMatch) {
    reps = parseInt(repsMatch[1], 10);
  }

  // Fallback sequential parser if weight or reps couldn't be extracted via keywords
  if (weight === null || reps === null) {
    const numbers = normalized.match(/\d+(?:\.\d+)?/g);
    if (numbers) {
      if (numbers.length >= 3) {
        // e.g. "set 2 with 135 for 8" -> set 2, weight 135, reps 8
        const seqSetNum = parseInt(numbers[0], 10);
        if (setNumber === null || setNumber === seqSetNum) {
          setNumber = seqSetNum;
          weight = parseFloat(numbers[1]);
          reps = parseInt(numbers[2], 10);
        }
      } else if (numbers.length === 2 && setNumber !== null) {
        // e.g. "set 2: 135 for 8" (already parsed setNumber = 2) -> weight 135, reps 8
        weight = parseFloat(numbers[0]);
        reps = parseInt(numbers[1], 10);
      }
    }
  }

  // If we successfully found all three components, return the log command!
  if (setNumber !== null && weight !== null && reps !== null) {
    return {
      command: "log_set",
      setNumber,
      weight,
      reps
    };
  }

  return null;
}

export function WorkoutScreen() {
  const storeExercises = useAtlasStore((state) => state.exercises);
  const getExerciseById = (id: string) => {
    const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return (
      storeExercises.find((e) => {
        const exerciseNormId = e.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return (
          e.id === id ||
          exerciseNormId === normId ||
          e.name.trim().toLowerCase() === id.trim().toLowerCase()
        );
      }) || getStaticExerciseById(id)
    );
  };
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const restTimerEndsAt = useAtlasStore((state) => state.restTimerEndsAt);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const updateSet = useAtlasStore((state) => state.updateSet);
  const addSet = useAtlasStore((state) => state.addSet);
  const finishWorkout = useAtlasStore((state) => state.finishWorkout);
  const discardWorkout = useAtlasStore((state) => state.discardWorkout);
  const startRestTimer = useAtlasStore((state) => state.startRestTimer);
  const stopRestTimer = useAtlasStore((state) => state.stopRestTimer);
  const adjustRestTimer = useAtlasStore((state) => state.adjustRestTimer);
  const allWorkouts = useAtlasStore((state) => state.workouts);
  const workouts = useMemo(() => {
    return allWorkouts.filter(w => w.exercises.some(ex => ex.sets.some(s => s.completed)));
  }, [allWorkouts]);

  const lastWorkoutForExercise = useMemo(() => {
    const map: Record<string, Array<{ reps: number; weight: number }>> = {};
    const completedWorkouts = [...workouts]
      .filter(w => w.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    for (const w of completedWorkouts) {
      for (const ex of w.exercises) {
        const exerciseKey = ex.exerciseId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (!ex.skipped && !map[exerciseKey]) {
          const completedSets = ex.sets.filter(s => s.completed);
          if (completedSets.length > 0) {
            map[exerciseKey] = completedSets.map(s => ({ reps: s.reps, weight: s.weight }));
          }
        }
      }
    }
    return map;
  }, [workouts]);

  const activeSubScreen = useAtlasStore((state) => state.activeSubScreen);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const setEditingWorkoutPlanId = useAtlasStore((state) => state.setEditingWorkoutPlanId);
  const deleteWorkoutPlan = useAtlasStore((state) => state.deleteWorkoutPlan);
  const activeWorkoutPlanId = useAtlasStore((state) => state.activeWorkoutPlanId);
  const setActiveWorkoutPlanId = useAtlasStore((state) => state.setActiveWorkoutPlanId);
  const swapWorkoutExercise = useAtlasStore((state) => state.swapWorkoutExercise);
  const skipWorkoutExercise = useAtlasStore((state) => state.skipWorkoutExercise);
  const weightUnit = useAtlasStore((state) => state.weightUnit);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const generateGlobalExercise = useAtlasStore((state) => state.generateGlobalExercise);
  const deleteSet = useAtlasStore((state) => state.deleteSet);
  const updateExerciseUnit = useAtlasStore((state) => state.updateExerciseUnit);
  const profile = useAtlasStore((state) => state.profile);
  const guidedMode = useAtlasStore((state) => state.guidedMode);

  // ─── Accordion focus state ───────────────────────────────────────────────────
  // focusedExIdx: which exercise index is currently expanded. -1 = all collapsed.
  const [focusedExIdx, setFocusedExIdx] = useState<number>(0);
  const [manualActiveSetIdx, setManualActiveSetIdx] = useState<Record<string, number>>({});
  // Refs for smooth scrolling to the focused exercise card
  const exerciseCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset accordion to first exercise whenever a NEW workout starts and scroll into view
  useEffect(() => {
    if (activeWorkout) {
      setFocusedExIdx(0);
      setManualActiveSetIdx({});
      // Smooth scroll to the first active exercise card after mounting
      setTimeout(() => {
        exerciseCardRefs.current[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    }
  }, [activeWorkout?.id]);

  // Daily limit check
  const getLocalDateString = (dateOrStr: Date | string) => {
    const d = typeof dateOrStr === "string" ? new Date(dateOrStr) : dateOrStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const workoutsToday = workouts.filter((w) => getLocalDateString(w.startedAt) === todayStr);
  const isLimitReached = workoutsToday.length >= 3;

  const handleGpxUpload = (event: React.ChangeEvent<HTMLInputElement>, workoutExerciseId: string, sets: any[]) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Parse track points
        const trkpts = xmlDoc.getElementsByTagName("trkpt");
        if (trkpts.length === 0) {
          alert("Invalid GPX File: No trackpoints (<trkpt>) found in the upload.");
          return;
        }

        // Calculate total duration (seconds) from track point times
        let durationSeconds = 1800; // fallback: 30 minutes
        const pointTimes: Date[] = [];
        for (let i = 0; i < trkpts.length; i++) {
          const timeNode = trkpts[i].getElementsByTagName("time")[0];
          if (timeNode?.textContent) {
            pointTimes.push(new Date(timeNode.textContent));
          }
        }

        if (pointTimes.length > 1) {
          durationSeconds = Math.round((pointTimes[pointTimes.length - 1].getTime() - pointTimes[0].getTime()) / 1000);
        }

        // Calculate total distance (miles) using Haversine formula
        let totalDistanceMiles = 0;
        const deg2rad = (deg: number) => deg * (Math.PI / 180);

        for (let i = 0; i < trkpts.length - 1; i++) {
          const lat1 = parseFloat(trkpts[i].getAttribute("lat") || "0");
          const lon1 = parseFloat(trkpts[i].getAttribute("lon") || "0");
          const lat2 = parseFloat(trkpts[i + 1].getAttribute("lat") || "0");
          const lon2 = parseFloat(trkpts[i + 1].getAttribute("lon") || "0");

          const R = 3958.8; // Radius of the Earth in miles
          const dLat = deg2rad(lat2 - lat1);
          const dLon = deg2rad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          totalDistanceMiles += distance;
        }

        totalDistanceMiles = parseFloat(totalDistanceMiles.toFixed(2));

        // Parse average heart rate if heart rate extension fields exist
        let hrSum = 0;
        let hrCount = 0;
        const hrs = xmlDoc.getElementsByTagName("gpxtpx:hr");
        const hrsAlternative = xmlDoc.getElementsByTagName("hr");
        const activeHrs = hrs.length > 0 ? hrs : hrsAlternative;
        for (let i = 0; i < activeHrs.length; i++) {
          const hrVal = parseInt(activeHrs[i].textContent || "0", 10);
          if (hrVal > 0) {
            hrSum += hrVal;
            hrCount++;
          }
        }
        const avgHr = hrCount > 0 ? Math.round(hrSum / hrCount) : undefined;

        // Estimate calories based on general cardio METs (8.0 METs) and user bodyweight
        const userWeightLbs = profile?.weight || 150;
        const weightKg = userWeightLbs / 2.20462;
        const durationMinutes = durationSeconds / 60;
        const metVal = 8.0;
        const estimatedCalories = Math.round(metVal * 3.5 * (weightKg / 200) * durationMinutes);

        // Autofill first set
        if (sets.length > 0) {
          const firstSet = sets[0];
          void updateSet(workoutExerciseId, firstSet.id, {
            durationSeconds,
            distance: totalDistanceMiles,
            calories: estimatedCalories,
            completed: true
          });

          alert(`GPX Telemetry Imported Successfully!\n\n• Duration: ${Math.floor(durationMinutes)}m ${durationSeconds % 60}s\n• Distance: ${totalDistanceMiles} miles\n${avgHr ? `• Avg Heart Rate: ${avgHr} BPM\n` : ""}• Est. Energy Expended: ${estimatedCalories} kcal`);
        }
      } catch (err: any) {
        alert("Error parsing GPX file. Please verify it is a standard tracklog file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [fatigue, setFatigue] = useState(6);
  const [notes, setNotes] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [timerMaxDuration, setTimerMaxDuration] = useState(60);
  const [elapsedWorkoutTime, setElapsedWorkoutTime] = useState(0);
  const [activeSwapExercise, setActiveSwapExercise] = useState<any | null>(null);
  const [swapSearch, setSwapSearch] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const planTab = useAtlasStore((state) => state.workoutTab);
  const setPlanTab = useAtlasStore((state) => state.setWorkoutTab);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechFeedback("Listening... Say: 'log set 2 135 pounds 8 reps'");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setSpeechFeedback(`Error: ${event.error}`);
      setTimeout(() => setSpeechFeedback(null), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSpeechFeedback(`Heard: "${transcript}"`);

      const parsed = parseSpeechCommand(transcript);
      if (parsed) {
        handleSpeechCommand(parsed);
      } else {
        setSpeechFeedback(`Couldn't parse: "${transcript}". Try 'log set 1 135 pounds 8 reps'`);
        setTimeout(() => setSpeechFeedback(null), 4000);
      }
    };

    recognition.start();
  };

  const handleSpeechCommand = (cmd: any) => {
    if (!activeWorkout) return;

    const activeEx = activeWorkout.exercises.find(ex => !ex.skipped && ex.sets.some(s => !s.completed)) || activeWorkout.exercises[0];
    if (!activeEx) return;

    if (cmd.command === "log_set") {
      const setIdx = cmd.setNumber - 1;
      const targetSet = activeEx.sets[setIdx];
      if (targetSet) {
        void updateSet(activeEx.id, targetSet.id, {
          weight: cmd.weight,
          reps: cmd.reps,
          completed: true
        });
        void startRestTimer(activeEx.restSeconds);
        setSpeechFeedback(`Set ${cmd.setNumber} logged: ${cmd.weight} ${weightUnit} x ${cmd.reps} reps!`);
      } else {
        setSpeechFeedback(`Set ${cmd.setNumber} not found in this exercise.`);
      }
    } else if (cmd.command === "add_set") {
      void addSet(activeEx.id);
      setSpeechFeedback("Added a new set!");
    } else if (cmd.command === "skip_exercise") {
      void skipWorkoutExercise(activeEx.id);
      setSpeechFeedback("Exercise skipped.");
    } else if (cmd.command === "start_rest") {
      void startRestTimer(activeEx.restSeconds);
      setSpeechFeedback("Rest timer started.");
    } else if (cmd.command === "stop_rest") {
      void stopRestTimer();
      setSpeechFeedback("Rest timer stopped.");
    }
    setTimeout(() => setSpeechFeedback(null), 3000);
  };

  const originalEx = useMemo(() => {
    if (!activeSwapExercise) return null;
    return getExerciseById(activeSwapExercise.exerciseId);
  }, [activeSwapExercise]);

  const alternatives = useMemo(() => {
    if (!originalEx) return [];
    const queryLower = swapSearch.toLowerCase();

    return exercises.filter((ex) => {
      // Must target the same primary muscle or have overlapping muscle groups
      const muscleOverlap = ex.muscles.some((m) => originalEx.muscles.includes(m));
      const isSelf = ex.id === originalEx.id;
      if (isSelf || !muscleOverlap) return false;

      return (
        ex.name.toLowerCase().includes(queryLower) ||
        ex.muscles.some((m) => m.toLowerCase().includes(queryLower)) ||
        ex.equipment.some((eq) => eq.toLowerCase().includes(queryLower))
      );
    });
  }, [originalEx, swapSearch]);

  const groupedAlternatives = useMemo(() => {
    const machines = alternatives.filter((ex) => ex.equipment.includes("machine"));
    const cables = alternatives.filter((ex) => ex.equipment.includes("cable"));
    const freeWeights = alternatives.filter((ex) =>
      ex.equipment.includes("barbell") ||
      ex.equipment.includes("dumbbell") ||
      ex.equipment.includes("kettlebell")
    );
    const bodyweight = alternatives.filter((ex) => ex.equipment.includes("bodyweight"));

    // Leftovers that are not in the main groups
    const mainIds = new Set([
      ...machines.map(m => m.id),
      ...cables.map(c => c.id),
      ...freeWeights.map(f => f.id),
      ...bodyweight.map(b => b.id)
    ]);
    const others = alternatives.filter((ex) => !mainIds.has(ex.id));

    return { machines, cables, freeWeights, bodyweight, others };
  }, [alternatives]);

  // State for pre-workout check-in modal
  const [showPreWorkoutModal, setShowPreWorkoutModal] = useState(false);
  const [routineToStart, setRoutineToStart] = useState<Routine | null>(null);

  // State for post-workout check-in modal
  const [showPostWorkoutModal, setShowPostWorkoutModal] = useState(false);
  // State for finish session modal
  const [showFinishSessionModal, setShowFinishSessionModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [planToActivate, setPlanToActivate] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);


  // Effect for rest timer countdown
  useEffect(() => {
    const tick = () => {
      if (!restTimerEndsAt) {
        setRemaining(0);
        return;
      }
      setRemaining(Math.max(0, Math.ceil((new Date(restTimerEndsAt).getTime() - Date.now()) / 1000)));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [restTimerEndsAt]);

  // Auto-request notification permissions when a workout is active
  useEffect(() => {
    if (activeWorkout && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }
  }, [activeWorkout]);

  // Track max timer duration for visual progress bar & trigger start notification
  const lastEndsAtRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (restTimerEndsAt) {
      const diff = Math.max(0, Math.ceil((new Date(restTimerEndsAt).getTime() - Date.now()) / 1000));
      if (diff > 0) {
        setTimerMaxDuration((prev) => Math.max(diff, prev));
        
        // Notify on transition or change in rest timer
        if (restTimerEndsAt !== lastEndsAtRef.current && diff > 2) {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("Rest Timer Started ⏱️", {
                body: `Rest for ${diff} seconds. Take a breath!`,
                tag: "atlas-rest-timer",
                silent: true,
              });
            } catch (e) {
              console.warn("Notification error:", e);
            }
          }
        }
      }
    } else {
      setTimerMaxDuration(60);
    }
    lastEndsAtRef.current = restTimerEndsAt;
  }, [restTimerEndsAt]);

  // Premium haptic, synthesized audio chime, and push notification on rest timer finish
  const restFinishedNotifiedRef = useRef<boolean>(false);
  useEffect(() => {
    if (restTimerEndsAt && remaining === 0) {
      if (!restFinishedNotifiedRef.current) {
        restFinishedNotifiedRef.current = true;
        if (navigator.vibrate) {
          navigator.vibrate([150, 100, 150]);
        }
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const audioCtx = new AudioCtx();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = "sine";
            oscillator.frequency.value = 880; // A5 pitch
            gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
          }
        } catch (err) {
          console.warn("Web Audio API rest chime bypassed:", err);
        }

        // Trigger finish Web Notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("Rest Finished! 🏋️", {
              body: "Time to start your next set!",
              tag: "atlas-rest-timer",
              requireInteraction: true,
            });
          } catch (e) {
            console.warn("Notification error:", e);
          }
        }
      }
    } else if (restTimerEndsAt && remaining > 0) {
      // Reset completed trigger flag when timer resets or ticks down
      restFinishedNotifiedRef.current = false;
    }
  }, [remaining, restTimerEndsAt]);

  // Effect for workout duration timer
  useEffect(() => {
    if (!activeWorkout?.startedAt) {
      setElapsedWorkoutTime(0);
      return;
    }

    const workoutStartedAt = new Date(activeWorkout.startedAt).getTime();
    const tickWorkoutDuration = () => {
      setElapsedWorkoutTime(Math.floor((Date.now() - workoutStartedAt) / 1000));
    };

    tickWorkoutDuration(); // Initial call
    const interval = window.setInterval(tickWorkoutDuration, 1000);
    return () => window.clearInterval(interval);
  }, [activeWorkout?.startedAt]);


  const filteredExercises = useMemo(() => {
    const lowered = query.toLowerCase();
    const list = storeExercises && storeExercises.length > 0 ? storeExercises : exercises;
    return list.filter((exercise) => {
      return (
        exercise.name.toLowerCase().includes(lowered) ||
        exercise.muscles.some((muscle) => muscle.toLowerCase().includes(lowered)) ||
        exercise.equipment.some((equipment) => equipment.toLowerCase().includes(lowered))
      );
    });
  }, [query, storeExercises]);

  const handleStartRoutineClick = (routine: Routine) => {
    setRoutineToStart(routine);
    setShowPreWorkoutModal(true);
  };

  const handlePreWorkoutConfirm = (sleepHours: number | undefined) => {
    if (routineToStart) {
      void startWorkout(routineToStart);
    }
    setShowPreWorkoutModal(false);
    setRoutineToStart(null);
  };

  const handleFinishSessionClick = () => {
    setShowFinishSessionModal(true);
  };

  const handleFinishSessionConfirm = (fatigueRating: number, workoutNotes: string) => {
    setFatigue(fatigueRating);
    setNotes(workoutNotes);
    setShowFinishSessionModal(false);
    setShowPostWorkoutModal(true); // Proceed to PostWorkoutCheckinModal
  };

  const handleFinishSessionDiscard = () => {
    void discardWorkout();
    setShowFinishSessionModal(false);
  };

  const handlePostWorkoutConfirm = (
    energy: number,
    soreness: number,
    stress: number,
    readiness: number,
  ) => {
    void finishWorkout(fatigue, notes);
    setShowPostWorkoutModal(false);
  };

  const handlePostWorkoutClose = () => {
    void finishWorkout(fatigue, notes);
    setShowPostWorkoutModal(false);
  };

  if (!activeWorkout || activeSubScreen !== "active-workout") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="space-y-4 pb-28"
      >
        {/* ─── Header ─── */}
        <section className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-555">
              {planTab === "plans" ? "Manage and track your plans" : "Track calories, macros & nutrients"}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-foreground">Plans</h1>
          </div>
          {planTab === "plans" && (
            <Button
              size="sm"
              variant="primary"
              icon={coachBusy ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" /> : <Plus size={16} />}
              disabled={coachBusy}
              onClick={() => {
                setEditingWorkoutPlanId(null);
                setActiveSubScreen("workout-plan-builder");
              }}
            >
              {coachBusy ? "Generating..." : "Create Plan"}
            </Button>
          )}
        </section>

        {/* ─── Tab Bar ─── */}
        <div className="flex gap-1 p-1 bg-input border border-input-border rounded-2xl select-none">
          {([
            { id: "plans" as const, label: "Workout Plans", emoji: "🏋️" },
            { id: "nutrition" as const, label: "Nutrition", emoji: "🥗" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              id={`plan-tab-${tab.id}`}
              role="tab"
              aria-selected={planTab === tab.id}
              onClick={() => setPlanTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98]",
                planTab === tab.id
                  ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-black/10 dark:shadow-black/40"
                  : "text-zinc-850 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Nutrition Tab ─── */}
        {planTab === "nutrition" && <NutritionTracker />}

        {/* ─── Plans Tab content (hidden when on nutrition) ─── */}
        {planTab === "plans" && (<>

        {coachBusy && (
          <Card className="p-4 border border-violet-500/20 bg-violet-500/[0.02] shadow-lg flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-violet-450 dark:text-violet-400 animate-pulse" />
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">AI Plan Generation in Progress</h4>
                <p className="text-xs text-zinc-400 mt-0.5 animate-pulse">Hang tight! Something awesome is cooking from your AI Coach... designing your clinical-grade routines.</p>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 rounded-full"
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{ position: "absolute", width: "50%" }}
              />
            </div>
          </Card>
        )}

        <Surface className="p-3.5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 text-zinc-750 dark:text-zinc-300 rounded-xl flex gap-3 items-start select-none">
          <Info size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-normal">
            This screen holds your workout routines. Tap <span className="text-zinc-900 dark:text-white font-bold">Start Training Session</span> to begin tracking sets, or tap <span className="text-zinc-900 dark:text-white font-bold">Create Plan</span> to design a new routine.
          </p>
        </Surface>

        {/* Warning banner for force stopped workout */}
        {(() => {
          const lastCompletedWorkout = workouts.filter(w => w.completedAt).at(-1);
          if (lastCompletedWorkout?.notes?.includes("Force stopped")) {
            return (
              <div className="p-4 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 dark:border-rose-500/20 text-rose-700 dark:text-rose-200 text-sm space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Last Workout Force Stopped</span>
                </div>
                <p className="text-zinc-650 dark:text-zinc-300 leading-relaxed text-xs">
                  Your last session ("{lastCompletedWorkout.name}") was automatically stopped because it exceeded the maximum 3-hour limit.
                </p>
              </div>
            );
          }
          return null;
        })()}

        {activeWorkout && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-200 text-sm flex items-center justify-between">
            <div>
              <p className="font-semibold">Workout in Progress</p>
              <p className="text-zinc-750 text-xs mt-0.5">"{activeWorkout.name}" is currently active in the background.</p>
            </div>
            <Button size="sm" variant="primary" onClick={() => setActiveSubScreen("active-workout")}>
              Resume Workout
            </Button>
          </div>
        )}

        {isLimitReached && !activeWorkout && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-200 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} className="text-amber-450 shrink-0" />
              <span>Daily Workout Limit Reached (3/3)</span>
            </div>
            <p className="text-zinc-750 leading-relaxed">
              You've completed 3 workouts today. Logging more than 3 sessions in a single day increases the risk of overtraining syndrome. This causes excessive muscle damage (rhabdomyolysis), central nervous fatigue, joint strain, and elevated cortisol. Give your body the rest it needs to recover and grow.
            </p>
          </div>
        )}

        {workoutPlans.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center justify-center border border-dashed border-card-border bg-zinc-50/20 dark:bg-white/[0.01] shadow-md">
            <ClipboardList className="h-12 w-12 text-emerald-500/80 dark:text-emerald-400/80 mb-4" />
            <h2 className="text-xl font-bold text-foreground">No workout programs found</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm leading-relaxed">
              Create a custom training program manually, start with a templates preset, or let our AI coach formulate a plan for you.
            </p>
            <Button
              className="mt-6 font-bold bg-emerald-500 hover:bg-emerald-400 text-white flex items-center gap-1.5"
              variant="primary"
              disabled={coachBusy}
              onClick={() => {
                setEditingWorkoutPlanId(null);
                setActiveSubScreen("workout-plan-builder");
              }}
            >
              <Plus size={16} />
              Create Custom Plan
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {workoutPlans.map((plan) => {
              const startOfWeek = (() => {
                const now = new Date();
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(now.setDate(diff));
                monday.setHours(0, 0, 0, 0);
                return monday;
              })();

              const planWorkouts = workouts.filter((w) => {
                const hasCompletedSets = w.exercises.some((ex) => ex.sets.some((s) => s.completed));
                return (
                  w.planId === plan.id &&
                  w.completedAt &&
                  new Date(w.completedAt).getTime() >= startOfWeek.getTime() &&
                  hasCompletedSets
                );
              });
              const completedRoutineNames = new Set(planWorkouts.map((w) => w.name));
              const routinesCount = plan.routines.length;
              const completedCount = plan.routines.filter((r) => completedRoutineNames.has(r.name)).length;
              const progressPercent = routinesCount > 0 ? Math.round((completedCount / routinesCount) * 100) : 0;
              const isActive = plan.id === activeWorkoutPlanId;

              return (
                <Card className="p-4 flex flex-col justify-between border border-card-border bg-card shadow hover:border-card-border transition-all duration-300" key={plan.id}>
                  <div>
                    <div className="flex items-start justify-between gap-4 border-b border-card-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{plan.name}</h2>
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-normal text-zinc-500 dark:text-zinc-400">{plan.goal}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit plan"
                          className="h-10 w-10 sm:h-8 sm:w-8 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-40"
                          disabled={coachBusy}
                          onClick={() => {
                            setEditingWorkoutPlanId(plan.id);
                            setActiveSubScreen("workout-plan-builder");
                          }}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete plan"
                          className="h-10 w-10 sm:h-8 sm:w-8 text-zinc-400 hover:text-rose-500 disabled:opacity-40"
                          disabled={coachBusy}
                          onClick={() => {
                            setPlanToDelete({ id: plan.id, name: plan.name });
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      <span className="rounded-lg bg-surface border border-surface-border px-2.5 py-0.5 font-bold text-zinc-750">
                        {plan.routines.length} {plan.routines.length === 1 ? "Routine" : "Routines"}
                      </span>
                      {plan.targetDate && (
                        <span className="rounded-lg bg-surface border border-surface-border px-2.5 py-0.5 font-bold text-zinc-750">
                          Target: {plan.targetDate}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1.5 border-t border-card-border pt-3">
                      <div className="flex items-center justify-between text-xs text-zinc-750 font-bold uppercase tracking-wider">
                        <span>Weekly Routines Progress</span>
                        <span className="font-bold text-emerald-500 dark:text-emerald-400">{completedCount}/{routinesCount}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface border border-surface-border overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button className="flex-1 text-xs font-bold py-2 shadow disabled:opacity-40" variant="primary" disabled={coachBusy} onClick={() => {
                      setEditingWorkoutPlanId(plan.id);
                      setActiveSubScreen("workout-plan-detail");
                    }}>
                      View Detailed Schedule
                    </Button>
                    {!isActive && (
                      <Button
                        className="flex-1 text-xs font-semibold py-2 border-btn-secondary-border bg-btn-secondary hover:bg-btn-secondary-hover text-foreground disabled:opacity-40"
                        variant="secondary"
                        disabled={coachBusy}
                        onClick={() => {
                          setPlanToActivate(plan.id);
                          setShowSwitchModal(true);
                        }}
                      >
                        Set Active Plan
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─── CATEGORIZED EXERCISE DATABASE EXPLORER ─── */}
        <Card className="p-5 border border-card-border bg-card shadow-lg">
          <div className="mb-4 flex items-center justify-between border-b border-card-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">Exercise Database</h2>
              <p className="text-xs text-zinc-550 dark:text-zinc-400">
                {filteredExercises.length} exercises · Clinical cues, setup guides, and progressive overload tips
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider hidden sm:inline">Explore</span>
              <Layers3 className="text-emerald-600 dark:text-emerald-450" size={18} />
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <Input
              maxLength={100}
              placeholder="Search by name, muscle, or equipment..."
              value={query}
              onChange={(event) => {
                const val = event.target.value;
                setQuery(val);
                // Auto-expand all categories when searching
                if (val.trim().length > 0) {
                  setExpandedCategories(new Set(["compound", "isolation", "cardio", "mobility"]));
                }
              }}
              className="pl-9"
            />
          </div>

          {/* Category Accordion */}
          <div className="mt-4 space-y-2">
            {([
              { key: "compound", label: "Compound Movements", description: "Multi-joint exercises for strength & mass", icon: Dumbbell, color: "emerald" },
              { key: "isolation", label: "Isolation Exercises", description: "Single-joint targeted muscle work", icon: Target, color: "sky" },
              { key: "cardio", label: "Cardio & Conditioning", description: "Heart rate elevation & endurance", icon: Heart, color: "rose" },
              { key: "mobility", label: "Mobility & Stability", description: "Flexibility, joint health & activation", icon: Footprints, color: "violet" },
            ] as const).map((cat) => {
              const categoryExercises = filteredExercises.filter((ex) => ex.category === cat.key);
              if (categoryExercises.length === 0) return null;
              const isExpanded = expandedCategories.has(cat.key);
              const CategoryIcon = cat.icon;

              const colorMap = {
                emerald: {
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                  text: "text-emerald-400",
                  icon: "text-emerald-400",
                  badge: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
                },
                sky: {
                  bg: "bg-sky-500/10",
                  border: "border-sky-500/20",
                  text: "text-sky-400",
                  icon: "text-sky-400",
                  badge: "bg-sky-500/15 text-sky-500 dark:text-sky-400 border-sky-500/20",
                },
                rose: {
                  bg: "bg-rose-500/10",
                  border: "border-rose-500/20",
                  text: "text-rose-400",
                  icon: "text-rose-400",
                  badge: "bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/20",
                },
                violet: {
                  bg: "bg-violet-500/10",
                  border: "border-violet-500/20",
                  text: "text-violet-400",
                  icon: "text-violet-400",
                  badge: "bg-violet-500/15 text-violet-500 dark:text-violet-400 border-violet-500/20",
                },
              };
              const c = colorMap[cat.color];

              return (
                <div key={cat.key} className="rounded-xl border border-surface-border bg-surface/60 overflow-hidden">
                  {/* Category Header (clickable accordion toggle) */}
                  <button
                    className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/[0.02] transition-colors group"
                    onClick={() => {
                      setExpandedCategories((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat.key)) {
                          next.delete(cat.key);
                        } else {
                          next.add(cat.key);
                        }
                        return next;
                      });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center shrink-0`}>
                        <CategoryIcon size={18} className={c.icon} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">{cat.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md border text-xs font-black ${c.badge}`}>
                        {categoryExercises.length}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    </div>
                  </button>

                  {/* Expanded exercise grid */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-card-border p-3"
                    >
                      <div className="grid gap-2 sm:grid-cols-2">
                        {categoryExercises.map((exercise) => {
                          const diffColors = {
                            beginner: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
                            intermediate: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15",
                            advanced: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15",
                          };
                          const diffText = exercise.difficulty || "beginner";

                          return (
                            <button
                              className="rounded-lg border border-surface-border bg-surface/50 p-3 text-left transition hover:border-card-border/80 hover:bg-surface/80 flex flex-col justify-between gap-2.5 group"
                              key={exercise.id}
                              onClick={() => setSelectedExercise(exercise)}
                            >
                              <div className="flex items-start justify-between w-full gap-2">
                                <div className="min-w-0">
                                  <p className="text-[13px] font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors leading-snug truncate">
                                    {exercise.name}
                                  </p>
                                  <p className="mt-0.5 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                                    {exercise.muscles.slice(0, 3).join(" · ")}
                                  </p>
                                </div>
                                <ChevronRight size={14} className="text-zinc-750 group-hover:text-zinc-955 shrink-0 transition-colors self-center" />
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded border ${diffColors[diffText]}`}>
                                  {diffText}
                                </span>
                                {exercise.equipment.slice(0, 2).map((eq) => (
                                  <span key={eq} className="px-1.5 py-0.5 rounded border border-surface-border bg-surface text-zinc-750">
                                    {eq}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Generation fallback when nothing found */}
          {filteredExercises.length === 0 && query.trim().length > 2 && (
            <div className="mt-5 p-4 rounded-xl bg-surface border border-surface-border text-center space-y-3">
              <Sparkles className="h-8 w-8 text-emerald-450 mx-auto animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-foreground leading-tight">Can&apos;t find &quot;{query}&quot;?</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-1 max-w-xs mx-auto leading-normal">
                  Our biomechanics engine can dynamically generate a full clinical-grade exercise profile covering correct setup cues, execution, breathing, mistakes, and safety advice.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white font-bold"
                disabled={coachBusy}
                onClick={async () => {
                  try {
                    const generated = await generateGlobalExercise(query);
                    if (generated) {
                      setSelectedExercise(generated);
                      setQuery("");
                    }
                  } catch (err: any) {
                    alert(err?.message || "Failed to search and generate exercise details.");
                  }
                }}
              >
                {coachBusy ? "Generating clinical cues..." : "AI Generate Exercise Profile"}
              </Button>
            </div>
          )}
        </Card>

        {selectedExercise ? <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} /> : null}

        {/* End of Plans tab content */}
        </>)}

        <PreWorkoutCheckinModal
          isOpen={showPreWorkoutModal}
          onClose={() => setShowPreWorkoutModal(false)}
          onConfirm={handlePreWorkoutConfirm}
        />

        {showSwitchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm p-6 space-y-4 relative border border-card-border shadow-2xl">
              <Button variant="ghost" size="icon" aria-label="Close" className="absolute top-2.5 right-2.5 text-zinc-750 hover:text-zinc-955 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5" onClick={() => {
                setShowSwitchModal(false);
                setPlanToActivate(null);
              }}>
                <X size={20} />
              </Button>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Switch Active Plan</h2>
              <p className="text-zinc-750 text-sm leading-relaxed">
                {activeWorkout
                  ? "Switching Active Plan: You have a workout session in progress. Switching plans will discard your current active workout and reset active tracking. Do you want to continue?"
                  : "Switching Active Plan: This will recalculate your streaks, consistency, and progress metrics for the new plan. Old progress will be saved separately. Do you want to continue?"}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => {
                  setShowSwitchModal(false);
                  setPlanToActivate(null);
                }} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={async () => {
                  if (planToActivate) {
                    await setActiveWorkoutPlanId(planToActivate);
                  }
                  setShowSwitchModal(false);
                  setPlanToActivate(null);
                }} className="flex-1">
                  Confirm Switch
                </Button>
              </div>
            </Card>
          </div>
        )}

        {showDeleteModal && planToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm p-6 space-y-4 relative border border-card-border shadow-2xl">
              <Button variant="ghost" size="icon" aria-label="Close" className="absolute top-2.5 right-2.5 text-zinc-750 hover:text-zinc-955 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5" onClick={() => {
                setShowDeleteModal(false);
                setPlanToDelete(null);
              }}>
                <X size={20} />
              </Button>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Delete Workout Plan</h2>
              <p className="text-zinc-750 text-sm leading-relaxed">
                {activeWorkout && activeWorkout.planId === planToDelete.id
                  ? `Are you sure you want to delete the plan "${planToDelete.name}"? You have a workout session in progress for this plan. Deleting it will permanently remove the plan and discard your current active workout.`
                  : `Are you sure you want to delete the plan "${planToDelete.name}"? This action cannot be undone and all routines inside this plan will be lost.`}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => {
                  setShowDeleteModal(false);
                  setPlanToDelete(null);
                }} className="flex-1">
                  Cancel
                </Button>
                <Button variant="danger" onClick={async () => {
                  if (planToDelete) {
                    await deleteWorkoutPlan(planToDelete.id);
                  }
                  setShowDeleteModal(false);
                  setPlanToDelete(null);
                }} className="flex-1">
                  Delete Plan
                </Button>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    );
  }

  const completedSets = activeWorkout.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  );
  const totalSets = activeWorkout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-32 pt-2"
    >
      {/* Sleek space-saving sticky mobile-friendly header */}
      <Card className="fixed inset-x-0 md:left-64 top-0 z-20 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 px-3 sm:px-4 sm:py-3 bg-header border-b border-card-border rounded-none shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto flex-nowrap">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-500 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white shrink-0 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg active:scale-95 transition-all"
              onClick={() => setActiveSubScreen(null)}
              aria-label="Back to plans"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-foreground truncate max-w-[130px] sm:max-w-[320px] leading-tight capitalize">
                {activeWorkout.name}
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-555 leading-none mt-0.5 font-semibold">
                {completedSets}/{totalSets} completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end flex-nowrap">
            {/* Hands-Free Voice Logger Button */}
            <Button
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg shrink-0 transition-all border border-surface-border hidden min-[380px]:inline-flex items-center justify-center active:scale-95",
                isListening
                  ? "bg-rose-500/20 text-rose-500 animate-pulse border-rose-500/35"
                  : "bg-transparent text-zinc-555 hover:text-zinc-955 hover:bg-surface"
              )}
              onClick={toggleListening}
              aria-label="Voice command logger"
              title="Voice command logging"
            >
              {isListening ? <Mic size={16} className="text-rose-500 animate-pulse" /> : <MicOff size={16} />}
            </Button>

            {/* Active Timer badge (Inline space-saving) */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold select-none h-9 shrink-0">
              <Timer size={15} className="shrink-0" />
              <span>{formatDuration(elapsedWorkoutTime)}</span>
            </div>

            {/* Rest state container (Interactive space-saving) */}
            <div
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                if (remaining > 0) void stopRestTimer();
                else void startRestTimer(60);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg border font-mono text-xs font-bold select-none h-9 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm",
                remaining > 0
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300 animate-pulse"
                  : "bg-surface border-surface-border text-zinc-555 hover:bg-surface/80"
              )}
              title={remaining > 0 ? "Tap to stop rest" : "Tap to start quick 60s rest"}
            >
              <Clock3 size={15} className="shrink-0" />
              <span>{remaining > 0 ? formatTimer(remaining) : "Rest"}</span>
            </div>

            {/* Quick Finish Button */}
            <Button
              size="sm"
              variant="primary"
              className="h-9 px-3.5 text-xs font-bold shrink-0 bg-emerald-500 text-zinc-955 hover:bg-emerald-400 rounded-lg flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              onClick={handleFinishSessionClick}
            >
              Finish
            </Button>
          </div>
        </div>

        {/* Voice Logger Transcription Feedback Alert Banner */}
        {speechFeedback && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold max-w-5xl mx-auto flex items-center gap-1.5 animate-pulse shadow-sm">
            <Sparkles size={15} className="text-emerald-450 dark:text-emerald-450 shrink-0" />
            <span>{speechFeedback}</span>
          </div>
        )}

        {/* Floating rest-timer action controllers */}
        {restTimerEndsAt && remaining > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-card-border flex items-center justify-between gap-2 max-w-5xl mx-auto select-none">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">Adjust Rest:</span>
            <div className="flex items-center gap-1.5">
              <Button
                className="h-8 px-2.5 text-xs font-bold bg-btn-secondary border-btn-secondary-border text-foreground hover:bg-btn-secondary-hover rounded-lg active:scale-95 transition-all"
                variant="secondary"
                onClick={() => void adjustRestTimer(-15)}
              >
                -15s
              </Button>
              <Button
                className="h-8 px-2.5 text-xs font-bold bg-btn-secondary border-btn-secondary-border text-foreground hover:bg-btn-secondary-hover rounded-lg active:scale-95 transition-all"
                variant="secondary"
                onClick={() => void adjustRestTimer(15)}
              >
                +15s
              </Button>
              <Button
                className="h-8 px-2.5 text-xs font-bold bg-btn-secondary border-btn-secondary-border text-foreground hover:bg-btn-secondary-hover rounded-lg active:scale-95 transition-all"
                variant="secondary"
                onClick={() => void adjustRestTimer(60)}
              >
                +60s
              </Button>
              <Button
                className="h-8 px-3 text-xs font-extrabold bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 rounded-lg active:scale-95 transition-all"
                variant="secondary"
                onClick={() => void stopRestTimer()}
              >
                Stop
              </Button>
            </div>
          </div>
        )}
        {/* Thin countdown progress bar at the bottom of the card */}
        {restTimerEndsAt && remaining > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000 ease-linear"
              style={{ width: `${timerMaxDuration > 0 ? (remaining / timerMaxDuration) * 100 : 0}%` }}
            />
          </div>
        )}
      </Card>

      {/* Active Workout Exercises mapping — smart accordion flow */}
      <div className="space-y-3 w-full max-w-5xl mx-auto px-0 sm:px-4">
        {activeWorkout.exercises.map((workoutExercise, exerciseIndex) => {
          const exercise = getExerciseById(workoutExercise.exerciseId);
          if (!exercise) {
            console.error("WorkoutScreen: Exercise not found for ID:", workoutExercise.exerciseId);
            return null;
          }

          const isSkipped = !!workoutExercise.skipped;
          const isExpanded = exerciseIndex === focusedExIdx;
          const stats = getExerciseStats(workouts, exercise.id, weightUnit);
          const allSetsCompleted = workoutExercise.sets.length > 0 && workoutExercise.sets.every(s => s.completed);
          const completedSetsCount = workoutExercise.sets.filter(s => s.completed).length;
          const totalSetsCount = workoutExercise.sets.length;
          const firstUncheckedSetIdx = workoutExercise.sets.findIndex(s => !s.completed);

          const defaultActiveSetIdx = firstUncheckedSetIdx === -1 ? Math.max(0, workoutExercise.sets.length - 1) : firstUncheckedSetIdx;
          const activeSetIdx = manualActiveSetIdx[workoutExercise.id] !== undefined
            ? manualActiveSetIdx[workoutExercise.id]
            : defaultActiveSetIdx;

          // Per-exercise unit: persisted in the workout exercise data
          const exUnit = workoutExercise.weightUnit ?? weightUnit;

          // Helper: handle completing a set with auto-advance and value propagation
          const handleCompleteSet = async (setId: string, currentlyCompleted: boolean) => {
            if (navigator.vibrate) navigator.vibrate(currentlyCompleted ? 6 : 14);

            const targetSetIdx = workoutExercise.sets.findIndex(s => s.id === setId);
            const targetSet = workoutExercise.sets[targetSetIdx];
            if (targetSet && !currentlyCompleted) {
              const prevSet = targetSetIdx > 0 ? workoutExercise.sets[targetSetIdx - 1] : null;
              const isTimeBased = exercise.category === "mobility" || /s\b|sec|min/i.test(workoutExercise.targetReps) || /hold/i.test(exercise.name) || /plank/i.test(exercise.name);
              const exerciseKey = workoutExercise.exerciseId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              const prevSessionSets = lastWorkoutForExercise[exerciseKey];
              const prevSessionSet = prevSessionSets ? (prevSessionSets[targetSetIdx] || prevSessionSets.at(-1)) : null;

              const defaultReps = isTimeBased ? 30 : 10;
              const prevReps = prevSessionSet ? prevSessionSet.reps : defaultReps;
              const prevWeight = prevSessionSet ? prevSessionSet.weight : 0;

              const displayReps = targetSet.reps === 0 ? (prevSet ? (prevSet.reps === 0 ? prevReps : prevSet.reps) : prevReps) : targetSet.reps;
              const displayWeight = targetSet.weight === 0 ? (prevSet ? (prevSet.weight === 0 ? prevWeight : prevSet.weight) : prevWeight) : targetSet.weight;

              await updateSet(workoutExercise.id, setId, {
                completed: true,
                reps: displayReps,
                weight: displayWeight
              });
            } else {
              await updateSet(workoutExercise.id, setId, { completed: !currentlyCompleted });
            }

            if (!currentlyCompleted) {
              void startRestTimer(workoutExercise.restSeconds);

              // Reset manual focus so it naturally falls back to firstUncheckedSetIdx sequentially
              setManualActiveSetIdx(prev => {
                const next = { ...prev };
                delete next[workoutExercise.id];
                return next;
              });

              // Copy weight/reps/cardio fields to subsequent uncompleted sets in this exercise
              const updatedExercise = useAtlasStore.getState().activeWorkout?.exercises[exerciseIndex];
              if (updatedExercise) {
                const completedSet = updatedExercise.sets.find(s => s.id === setId);
                if (completedSet) {
                  const completedSetIdx = updatedExercise.sets.findIndex(s => s.id === setId);
                  const nextSetsToUpdate = updatedExercise.sets.slice(completedSetIdx + 1).filter(s => !s.completed);
                  if (nextSetsToUpdate.length > 0) {
                    await Promise.all(
                      nextSetsToUpdate.map(ns => {
                        const patch: any = {};
                        if (completedSet.weight !== undefined) patch.weight = completedSet.weight;
                        if (completedSet.reps !== undefined) patch.reps = completedSet.reps;
                        if (completedSet.durationSeconds !== undefined) patch.durationSeconds = completedSet.durationSeconds;
                        if (completedSet.distance !== undefined) patch.distance = completedSet.distance;
                        if (completedSet.incline !== undefined) patch.incline = completedSet.incline;
                        if (completedSet.resistance !== undefined) patch.resistance = completedSet.resistance;
                        if (completedSet.calories !== undefined) patch.calories = completedSet.calories;
                        return updateSet(workoutExercise.id, ns.id, patch);
                      })
                    );
                  }
                }
              }

              // Check if this was the last uncompleted set in this exercise
              const finalExercise = useAtlasStore.getState().activeWorkout?.exercises[exerciseIndex];
              if (finalExercise && finalExercise.sets.every(s => s.completed)) {
                const totalExercises = useAtlasStore.getState().activeWorkout?.exercises.length ?? 0;
                const nextIdx = exerciseIndex + 1;
                if (nextIdx < totalExercises) {
                  setTimeout(() => {
                    setFocusedExIdx(nextIdx);
                    setTimeout(() => {
                      exerciseCardRefs.current[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 150);
                  }, 400); // brief delay so user sees the ✓ animation
                }
              }
            }
          };

          // Helper: toggle unit for this exercise
          const handleToggleUnit = async () => {
            const next = exUnit === "kg" ? "lbs" : "kg";
            // Convert all set weights inline
            const factor = exUnit === "kg" ? 2.20462 : 1 / 2.20462;
            await Promise.all(
              workoutExercise.sets.map(s =>
                updateSet(workoutExercise.id, s.id, {
                  weight: parseFloat((s.weight * factor).toFixed(1)),
                })
              )
            );
            await updateExerciseUnit(workoutExercise.id, next);
          };

          const isCardio = exercise.category === "cardio" || exercise.category === "steady-state";
          const isTreadmill = exercise.equipment.includes("treadmill");
          const hasResistance = isCardio && (
            exercise.equipment.some(eq =>
              ["elliptical", "stationary-bike", "stairclimber", "rowing-machine", "rower"].includes(eq)
            ) ||
            exercise.id.includes("row") ||
            exercise.name.toLowerCase().includes("row")
          );
          const cardioLabel = isTreadmill ? "Incline %" : hasResistance ? "Resist" : "Level";

          return (
            <div
              key={workoutExercise.id}
              ref={el => { exerciseCardRefs.current[exerciseIndex] = el; }}
            >
              <Card
                className={`transition-all duration-300 relative overflow-hidden rounded-none sm:rounded-2xl border-x-0 sm:border-x ${
                  isSkipped
                    ? "opacity-50 border-dashed bg-surface/30 border-surface-border"
                    : allSetsCompleted && !isExpanded
                    ? "border-emerald-500/30 bg-emerald-500/[0.03] shadow-sm"
                    : isExpanded
                    ? "shadow-xl border-emerald-500/20 ring-1 ring-emerald-500/10"
                    : "shadow-sm hover:shadow-md border-card-border"
                }`}
              >
                {/* Superset top bar */}
                {workoutExercise.supersetGroup && !isSkipped && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500" />
                )}

                {/* Active exercise left accent pulse */}
                {isExpanded && !isSkipped && !allSetsCompleted && (
                  <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-emerald-500 rounded-l-full" />
                )}

                {/* ── Accordion Header (always visible, always tappable) ── */}
                <button
                  className="w-full text-left p-3.5 sm:p-4 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-[inherit] min-h-[64px]"
                  onClick={() => setFocusedExIdx(isExpanded ? -1 : exerciseIndex)}
                  aria-expanded={isExpanded}
                >
                  {/* Exercise completion badge / number */}
                  <div
                    className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                      allSetsCompleted
                        ? "bg-emerald-500 text-white"
                        : isExpanded
                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                        : "bg-surface border border-surface-border text-zinc-555"
                    }`}
                  >
                    {allSetsCompleted ? <Check size={16} className="stroke-[3px]" /> : exerciseIndex + 1}
                  </div>

                  {/* Name + chips */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider font-mono">
                        {isCardio ? workoutExercise.targetReps : `${workoutExercise.targetSets}×${workoutExercise.targetReps}`}
                      </span>
                      {workoutExercise.supersetGroup && (
                        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-sky-500/10 border border-sky-500/25 text-sky-500 text-[10px] font-bold leading-none select-none">
                          <Layers3 size={12} />
                          {workoutExercise.supersetGroup}
                        </span>
                      )}
                      {isSkipped && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] font-bold leading-none uppercase">
                          Skipped
                        </span>
                      )}
                    </div>
                    <p className="text-base sm:text-lg font-bold text-foreground leading-snug truncate">
                      {exercise.name}
                    </p>
                    {/* Progress summary when collapsed */}
                    {!isExpanded && (
                      <p className="text-xs text-zinc-555 mt-0.5">
                        {isCardio ? (
                          allSetsCompleted ? "Session completed ✓" : "Steady state cardio"
                        ) : allSetsCompleted
                          ? `All ${totalSetsCount} sets done ✓`
                          : completedSetsCount > 0
                          ? `${completedSetsCount}/${totalSetsCount} sets done`
                          : exercise.muscles.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* Expand/collapse chevron */}
                  <div className="shrink-0 ml-1">
                    {isExpanded
                      ? <ChevronUp size={20} className="text-emerald-500" />
                      : <ChevronDown size={20} className="text-zinc-555" />
                    }
                  </div>
                </button>

                {/* ── Expanded Content ── */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="px-3.5 sm:px-4 pb-4 space-y-3 border-t border-card-border/60 pt-3">

                        {/* Muscle chips + action buttons row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-card-border/60 pb-3">
                          <div className="flex flex-wrap gap-1 min-w-0">
                            {exercise.muscles.map(muscle => (
                              <span
                                key={muscle}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface text-zinc-755 border border-surface-border capitalize leading-none"
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>

                          {/* Action buttons row: scrollable on mobile for premium high-fidelity native feeling, wraps on desktop */}
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0 justify-start sm:justify-end -mx-3.5 px-3.5 sm:mx-0 sm:px-0 select-none w-[calc(100%+1.75rem)] sm:w-auto">
                            {/* kg/lbs toggle button */}
                            {!isCardio && (
                              <button
                                type="button"
                                onClick={handleToggleUnit}
                                className="h-9 px-3 rounded-xl border border-surface-border bg-surface text-xs font-black text-zinc-755 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5 transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 cursor-pointer"
                                title={`Switch to ${exUnit === "kg" ? "lbs" : "kg"}`}
                              >
                                <Scale size={15} className="text-zinc-500 dark:text-zinc-400" />
                                <span>{exUnit.toUpperCase()}</span>
                              </button>
                            )}

                            {/* Step-by-Step Info */}
                            <button
                              type="button"
                              onClick={() => setSelectedExercise(exercise)}
                              className="h-9 px-3 rounded-xl border border-surface-border bg-surface text-xs font-bold text-zinc-755 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 cursor-pointer"
                              aria-label="View step-by-step instructions"
                            >
                              <Info size={15} className="text-zinc-500 dark:text-zinc-400" />
                              <span>Guide</span>
                            </button>

                            {/* Swap */}
                            {!isSkipped && (
                              <button
                                type="button"
                                onClick={() => { setActiveSwapExercise(workoutExercise); setSwapSearch(""); }}
                                className="h-9 px-3 rounded-xl border border-surface-border bg-surface text-xs font-bold text-zinc-755 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 cursor-pointer"
                                aria-label="Swap exercise"
                              >
                                <Shuffle size={15} className="text-zinc-500 dark:text-zinc-400" />
                                <span>Swap</span>
                              </button>
                            )}

                            {/* Skip/Resume */}
                            <button
                              type="button"
                              onClick={() => void skipWorkoutExercise(workoutExercise.id)}
                              className={cn(
                                "h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 cursor-pointer",
                                isSkipped
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15"
                                  : "bg-surface border-surface-border text-zinc-755 hover:border-emerald-500/40 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-white/5"
                              )}
                              aria-label={isSkipped ? "Resume exercise" : "Skip exercise"}
                            >
                              <SkipForward size={15} className={isSkipped ? "text-amber-500 animate-pulse" : "text-zinc-500 dark:text-zinc-400"} />
                              <span>{isSkipped ? "Resume" : "Skip"}</span>
                            </button>

                            {/* Add Set */}
                            {!isSkipped && !isCardio && (
                              <button
                                type="button"
                                onClick={() => void addSet(workoutExercise.id)}
                                className="h-9 px-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 cursor-pointer"
                                aria-label="Add set"
                              >
                                <CirclePlus size={15} className="text-emerald-500" />
                                <span>Add Set</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* PR / Last Lift row */}
                        {!isSkipped && stats && (
                          <div className="px-2.5 py-1.5 bg-surface/50 rounded-xl border border-surface-border flex items-center justify-between text-xs text-zinc-750 select-none">
                            <span className="truncate max-w-[68%] leading-none">
                              <span className="text-zinc-455 font-bold">Last:</span> {stats.last}
                            </span>
                            <span className="shrink-0 font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25 leading-none">
                              PR: {stats.pr}
                            </span>
                          </div>
                        )}

                        {/* Set Logging */}
                        {!isSkipped ? (
                          <div className="space-y-2">
                            {isCardio ? (
                              <>
                                {/* GPX upload banner */}
                                <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-2.5 rounded-xl border border-purple-500/10 select-none">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Upload size={14} className="text-purple-400 shrink-0" />
                                    <div className="text-left min-w-0">
                                      <p className="text-xs font-bold text-foreground leading-tight">GPX Sync</p>
                                      <p className="text-xs text-zinc-500 mt-0.5 leading-none hidden sm:block">Auto-fill duration, distance & calories from a .GPX file.</p>
                                    </div>
                                  </div>
                                  <label className="h-7 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 cursor-pointer text-white-keep flex items-center justify-center transition-all shrink-0">
                                    Upload
                                    <input type="file" accept=".gpx" className="hidden" onChange={e => handleGpxUpload(e, workoutExercise.id, workoutExercise.sets)} />
                                  </label>
                                </div>

                                {workoutExercise.sets.map((set, setIndex) => {
                                  const isActiveSet = setIndex === activeSetIdx;
                                  const prevSet = setIndex > 0 ? workoutExercise.sets[setIndex - 1] : null;

                                  // ─── Case 1: Completed Set ───
                                  if (set.completed) {
                                    return (
                                      <div
                                        key={set.id}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-700 dark:text-emerald-300 transition-all select-none min-h-[44px]"
                                      >
                                        <span className="font-black text-emerald-500 shrink-0">{isCardio ? "CARDIO" : `#${setIndex + 1}`}</span>
                                        <span className="flex-1 font-semibold truncate text-left">
                                          {set.durationSeconds !== undefined ? `${Math.round(set.durationSeconds / 60)}min` : "—"}
                                          {set.distance ? ` · ${set.distance}mi` : ""}
                                          {set.calories ? ` · ${set.calories}kcal` : ""}
                                        </span>
                                        <Check size={16} className="stroke-[3px] text-emerald-500 shrink-0" />
                                        {!isCardio && (
                                          <button
                                            type="button"
                                            className="text-zinc-455 hover:text-rose-500 transition-colors h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                            onClick={() => void deleteSet(workoutExercise.id, set.id)}
                                            aria-label="Delete set"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className="text-emerald-600 dark:text-emerald-400 hover:text-zinc-755 transition-colors h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                          onClick={() => {
                                            if (navigator.vibrate) navigator.vibrate(6);
                                            void updateSet(workoutExercise.id, set.id, { completed: false });
                                          }}
                                          aria-label="Undo set completion"
                                          title="Undo"
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    );
                                  }

                                  // ─── Case 2: Active Focused Set Card ───
                                  if (isActiveSet) {
                                    const displayMin = set.durationSeconds !== undefined ? parseFloat((set.durationSeconds / 60).toFixed(2)) : (prevSet?.durationSeconds !== undefined ? parseFloat((prevSet.durationSeconds / 60).toFixed(2)) : 30);
                                    const displayDist = set.distance ?? prevSet?.distance ?? 0;
                                    const displayCardioLabel = isTreadmill ? (set.incline ?? prevSet?.incline ?? 0) : (set.resistance ?? prevSet?.resistance ?? 0);
                                    const displayKcal = set.calories ?? prevSet?.calories ?? 0;

                                    return (
                                      <div
                                        key={set.id}
                                        className="flex flex-col gap-3.5 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/15 shadow-md transition-all text-left"
                                      >
                                        <div className="flex items-center justify-between border-b border-card-border/60 pb-2.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-emerald-500 tracking-wider">
                                              {isCardio ? "CARDIO SESSION" : `SET #${setIndex + 1}`} (ACTIVE)
                                            </span>
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {!isCardio && (
                                              <Button
                                                aria-label="Delete set"
                                                className="h-10 w-10 rounded-xl text-zinc-750 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                size="icon" variant="ghost"
                                                onClick={() => void deleteSet(workoutExercise.id, set.id)}
                                              >
                                                <Trash2 size={16} />
                                              </Button>
                                            )}
                                            <Button
                                              aria-label="Complete set"
                                              className="h-10 px-4 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-1.5 bg-emerald-500 text-white border border-transparent hover:bg-emerald-600 active:scale-[0.97] cursor-pointer shadow-sm"
                                              onClick={() => void handleCompleteSet(set.id, set.completed)}
                                            >
                                              <Check size={16} className="stroke-[3px]" />
                                              Check
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                                          {[
                                            {
                                              label: "Min",
                                              value: displayMin,
                                              step: 1.0,
                                              onChange: (v: number) => void updateSet(workoutExercise.id, set.id, { durationSeconds: Math.round(v * 60) }),
                                              max: 999,
                                              inputMode: "decimal" as const,
                                              formattedStep: "any"
                                            },
                                            {
                                              label: "Dist (mi)",
                                              value: displayDist,
                                              step: 0.1,
                                              onChange: (v: number) => void updateSet(workoutExercise.id, set.id, { distance: v }),
                                              max: 999,
                                              inputMode: "decimal" as const,
                                              formattedStep: "any"
                                            },
                                            {
                                              label: cardioLabel,
                                              value: displayCardioLabel,
                                              step: 1.0,
                                              onChange: (v: number) => void updateSet(workoutExercise.id, set.id, isTreadmill ? { incline: v } : { resistance: v }),
                                              max: 100,
                                              inputMode: "decimal" as const,
                                              formattedStep: "any"
                                            },
                                            {
                                              label: "kcal",
                                              value: displayKcal,
                                              step: 10.0,
                                              onChange: (v: number) => void updateSet(workoutExercise.id, set.id, { calories: v }),
                                              max: 9999,
                                              inputMode: "numeric" as const,
                                              formattedStep: "1"
                                            },
                                          ].map(field => (
                                            <div key={field.label}>
                                              <label className="block text-[10px] font-black uppercase text-zinc-755 tracking-wider mb-1.5">{field.label}</label>
                                              <div className="flex items-center bg-surface border border-surface-border rounded-xl px-1 py-0.5 select-none shadow-sm focus-within:border-emerald-500/50 transition-colors">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (navigator.vibrate) navigator.vibrate(6);
                                                    const v = parseFloat(Math.max(0, field.value - field.step).toFixed(2));
                                                    field.onChange(v);
                                                  }}
                                                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
                                                  aria-label={`Decrease ${field.label}`}
                                                >
                                                  <Minus size={12} className="stroke-[3px]" />
                                                </button>
                                                <Input
                                                  inputMode={field.inputMode}
                                                  type="number"
                                                  min={0}
                                                  max={field.max}
                                                  step={field.formattedStep}
                                                  className="h-8 px-1 text-center font-bold bg-transparent border-0 shadow-none text-xs w-full text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                                  value={field.value}
                                                  onChange={e => field.onChange(Math.min(field.max, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (navigator.vibrate) navigator.vibrate(6);
                                                    const v = parseFloat(Math.min(field.max, field.value + field.step).toFixed(2));
                                                    field.onChange(v);
                                                  }}
                                                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
                                                  aria-label={`Increase ${field.label}`}
                                                >
                                                  <Plus size={12} className="stroke-[3px]" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // ─── Case 3: Future Uncompleted Set (Collapsed) ───
                                  const displayMin = set.durationSeconds !== undefined ? parseFloat((set.durationSeconds / 60).toFixed(2)) : (prevSet?.durationSeconds !== undefined ? parseFloat((prevSet.durationSeconds / 60).toFixed(2)) : 30);
                                  const displayDist = set.distance ?? prevSet?.distance ?? 0;
                                  const displayCardioLabel = isTreadmill ? (set.incline ?? prevSet?.incline ?? 0) : (set.resistance ?? prevSet?.resistance ?? 0);
                                  const displayKcal = set.calories ?? prevSet?.calories ?? 0;

                                  return (
                                    <div
                                      key={set.id}
                                      onClick={() => setManualActiveSetIdx(prev => ({ ...prev, [workoutExercise.id]: setIndex }))}
                                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface/30 border border-surface-border text-xs text-zinc-750 transition-all select-none hover:bg-surface/50 cursor-pointer min-h-[44px]"
                                    >
                                      <span className="font-bold text-zinc-555 shrink-0">CARDIO</span>
                                      <span className="flex-1 text-left font-medium truncate">
                                        Target {displayMin}min · {displayDist}mi · {displayCardioLabel} {isTreadmill ? "%" : "Lvl"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void handleCompleteSet(set.id, set.completed);
                                        }}
                                        className="h-9 px-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer shrink-0 shadow-sm"
                                      >
                                        <Check size={15} className="stroke-[3px]" />
                                        Check
                                      </button>
                                    </div>
                                  );
                                })}
                              </>
                            ) : (
                              /* ── Strength exercises ── */
                              <>
                                {(() => {
                                  const isTimeBased = exercise.category === "mobility" || /s\b|sec|min/i.test(workoutExercise.targetReps) || /hold/i.test(exercise.name) || /plank/i.test(exercise.name);
                                  const exerciseKey = workoutExercise.exerciseId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                                  const prevSessionSets = lastWorkoutForExercise[exerciseKey];

                                  return workoutExercise.sets.map((set, setIndex) => {
                                    const isActiveSet = setIndex === activeSetIdx;
                                    const prevSet = setIndex > 0 ? workoutExercise.sets[setIndex - 1] : null;

                                    const prevSessionSet = prevSessionSets ? (prevSessionSets[setIndex] || prevSessionSets.at(-1)) : null;
                                    const defaultReps = isTimeBased ? 30 : 10;
                                    const prevReps = prevSessionSet ? prevSessionSet.reps : defaultReps;
                                    const prevWeight = prevSessionSet ? prevSessionSet.weight : 0;

                                    const displayReps = set.reps === 0 ? (prevSet ? (prevSet.reps === 0 ? prevReps : prevSet.reps) : prevReps) : set.reps;
                                    const displayWeight = set.weight === 0 ? (prevSet ? (prevSet.weight === 0 ? prevWeight : prevSet.weight) : prevWeight) : set.weight;

                                    // ─── Case 1: Completed Set ───
                                    if (set.completed) {
                                      return (
                                        <div
                                          key={set.id}
                                          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs select-none transition-all min-h-[44px]"
                                        >
                                          <span className="font-black text-emerald-500 shrink-0">#{setIndex + 1}</span>
                                          {set.isDropSet && (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">Drop</span>
                                          )}
                                          <span className="flex-1 font-semibold text-emerald-700 dark:text-emerald-300 truncate text-left">
                                            {isTimeBased ? `${set.reps}s` : `${set.reps} reps`} · {set.weight === 0 ? "bodyweight" : `${set.weight} ${exUnit}`}
                                            {set.rir !== undefined ? ` · RIR ${set.rir}` : ""}
                                          </span>
                                          <Check size={16} className="stroke-[3px] text-emerald-500 shrink-0" />
                                          <button
                                            type="button"
                                            className="text-zinc-455 hover:text-rose-500 transition-colors h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                            onClick={() => void deleteSet(workoutExercise.id, set.id)}
                                            aria-label="Delete set"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                          <button
                                            type="button"
                                            className="text-emerald-600 dark:text-emerald-400 hover:text-zinc-755 transition-colors h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                            onClick={() => {
                                              if (navigator.vibrate) navigator.vibrate(6);
                                              void updateSet(workoutExercise.id, set.id, { completed: false });
                                            }}
                                            aria-label="Undo set completion"
                                            title="Undo"
                                          >
                                            <X size={16} />
                                          </button>
                                        </div>
                                      );
                                    }

                                    // ─── Case 2: Active Focused Set Card ───
                                    if (isActiveSet) {
                                      return (
                                        <div
                                          key={set.id}
                                          className="flex flex-col gap-3.5 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/15 shadow-md transition-all text-left"
                                        >
                                          <div className="flex items-center justify-between border-b border-card-border/60 pb-2.5">
                                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 min-w-0">
                                              <span className="text-xs font-black text-emerald-500 tracking-wider">
                                                SET #{setIndex + 1} (ACTIVE)
                                              </span>
                                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                              {set.isDropSet && (
                                                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-black uppercase tracking-wider text-amber-500">Drop</span>
                                              )}
                                              {prevSessionSet && (
                                                <span className="text-[10px] font-black text-zinc-555">
                                                  Last: {prevSessionSet.weight === 0 ? "BW" : `${prevSessionSet.weight}${exUnit}`} x {prevSessionSet.reps}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Button
                                                aria-label="Delete set"
                                                className="h-10 w-10 rounded-xl text-zinc-750 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                size="icon" variant="ghost"
                                                onClick={() => void deleteSet(workoutExercise.id, set.id)}
                                              >
                                                <Trash2 size={16} />
                                              </Button>
                                              <Button
                                                aria-label="Complete set"
                                                className="h-11 px-5 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-1.5 bg-emerald-500 text-white border border-transparent hover:bg-emerald-600 active:scale-[0.97] cursor-pointer shadow-sm"
                                                onClick={() => void handleCompleteSet(set.id, set.completed)}
                                              >
                                                <Check size={16} className="stroke-[3px]" />
                                                Check
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                                            {(() => {
                                              const repStep = isTimeBased ? 5 : 1;
                                              const maxRepVal = isTimeBased ? 999 : 100;
                                              return (
                                                <div>
                                                  <label className="block text-[10px] font-black uppercase text-zinc-750 tracking-wider mb-1.5">{isTimeBased ? "Seconds" : "Reps"}</label>
                                                  <div className="flex items-center bg-surface border border-surface-border rounded-xl px-1 py-0.5 select-none shadow-sm focus-within:border-emerald-500/50 transition-colors h-11">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        if (navigator.vibrate) navigator.vibrate(6);
                                                        const v = Math.max(0, displayReps - repStep);
                                                        void updateSet(workoutExercise.id, set.id, { reps: v });
                                                      }}
                                                      className="h-10 w-10 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
                                                      aria-label={isTimeBased ? "Decrease seconds" : "Decrease reps"}
                                                    >
                                                      <Minus size={14} className="stroke-[3px]" />
                                                    </button>
                                                    <Input
                                                      inputMode="numeric" type="number" min={0} max={maxRepVal}
                                                      className="h-9 px-1 text-center font-bold bg-transparent border-0 shadow-none text-sm w-full text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                                      value={set.reps === 0 ? "" : set.reps}
                                                      placeholder={String(displayReps)}
                                                      onChange={e => {
                                                        const v = Math.min(maxRepVal, Math.max(0, Number(e.target.value)));
                                                        void updateSet(workoutExercise.id, set.id, { reps: v });
                                                      }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        if (navigator.vibrate) navigator.vibrate(6);
                                                        const v = Math.min(maxRepVal, displayReps + repStep);
                                                        void updateSet(workoutExercise.id, set.id, { reps: v });
                                                      }}
                                                      className="h-10 w-10 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
                                                      aria-label={isTimeBased ? "Increase seconds" : "Increase reps"}
                                                    >
                                                      <Plus size={14} className="stroke-[3px]" />
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })()}
                                            
                                            <div>
                                              <label className="block text-[10px] font-black uppercase text-zinc-750 tracking-wider mb-1.5">Load ({exUnit})</label>
                                              <div className="flex items-center bg-surface border border-surface-border rounded-xl px-1 py-0.5 select-none shadow-sm focus-within:border-emerald-500/50 transition-colors h-11">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (navigator.vibrate) navigator.vibrate(6);
                                                    const step = exUnit === "kg" ? 1.0 : 2.5;
                                                    const v = parseFloat(Math.max(0, displayWeight - step).toFixed(1));
                                                    void updateSet(workoutExercise.id, set.id, { weight: v });
                                                  }}
                                                  className="h-10 w-10 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
                                                  aria-label="Decrease load"
                                                >
                                                  <Minus size={14} className="stroke-[3px]" />
                                                </button>
                                                <Input
                                                  inputMode="decimal" type="number" min={0} max={2000} step="any"
                                                  className="h-9 px-1 text-center font-bold bg-transparent border-0 shadow-none text-sm w-full text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                                  value={set.weight === 0 ? "" : set.weight}
                                                  placeholder={String(displayWeight)}
                                                  onChange={e => {
                                                    const v = Math.min(2000, Math.max(0, Number(e.target.value)));
                                                    void updateSet(workoutExercise.id, set.id, { weight: v });
                                                  }}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (navigator.vibrate) navigator.vibrate(6);
                                                    const step = exUnit === "kg" ? 1.0 : 2.5;
                                                    const v = parseFloat(Math.min(2000, displayWeight + step).toFixed(1));
                                                    void updateSet(workoutExercise.id, set.id, { weight: v });
                                                  }}
                                                  className="h-10 w-10 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
                                                  aria-label="Increase load"
                                                >
                                                  <Plus size={14} className="stroke-[3px]" />
                                                </button>
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <label className="block text-[10px] font-black uppercase text-zinc-750 tracking-wider mb-1.5">RIR</label>
                                              {guidedMode ? (
                                                <div className="bg-surface border border-surface-border rounded-xl overflow-hidden shadow-sm focus-within:border-emerald-500/50 h-11 flex items-center">
                                                  <Select
                                                    value={set.rir === 8 ? "easy" : set.rir === 0 ? "hard" : "moderate"}
                                                    onChange={e => {
                                                      if (navigator.vibrate) navigator.vibrate(6);
                                                      const v = e.target.value === "easy" ? 8 : e.target.value === "hard" ? 0 : 4;
                                                      void updateSet(workoutExercise.id, set.id, { rir: v });
                                                    }}
                                                    className="h-10 py-0.5 px-2 text-center font-bold bg-transparent border-0 text-xs w-full text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                                  >
                                                    <option value="easy">Easy (8)</option>
                                                    <option value="moderate">Mod (4)</option>
                                                    <option value="hard">Hard (0)</option>
                                                  </Select>
                                                </div>
                                              ) : (
                                                <div className="flex items-center bg-surface border border-surface-border rounded-xl px-1 py-0.5 select-none shadow-sm focus-within:border-emerald-500/50 transition-colors h-11">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (navigator.vibrate) navigator.vibrate(6);
                                                      const v = Math.max(0, (set.rir ?? 2) - 1);
                                                      void updateSet(workoutExercise.id, set.id, { rir: v });
                                                    }}
                                                    className="h-10 w-10 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
                                                    aria-label="Decrease RIR"
                                                  >
                                                    <Minus size={14} className="stroke-[3px]" />
                                                  </button>
                                                  <Input
                                                    inputMode="numeric" type="number" min={0} max={10}
                                                    className="h-9 px-1 text-center font-bold bg-transparent border-0 shadow-none text-sm w-full text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                                    value={set.rir ?? 2}
                                                    onChange={e => {
                                                      const v = Math.min(10, Math.max(0, Number(e.target.value)));
                                                      void updateSet(workoutExercise.id, set.id, { rir: v });
                                                    }}
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (navigator.vibrate) navigator.vibrate(6);
                                                      const v = Math.min(10, (set.rir ?? 2) + 1);
                                                      void updateSet(workoutExercise.id, set.id, { rir: v });
                                                    }}
                                                    className="h-10 w-10 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
                                                    aria-label="Increase RIR"
                                                  >
                                                    <Plus size={14} className="stroke-[3px]" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }

                                    // ─── Case 3: Future Uncompleted Set (Collapsed) ───
                                    return (
                                      <div
                                        key={set.id}
                                        onClick={() => setManualActiveSetIdx(prev => ({ ...prev, [workoutExercise.id]: setIndex }))}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface/30 border border-surface-border text-xs text-zinc-750 transition-all select-none hover:bg-surface/50 cursor-pointer min-h-[44px]"
                                      >
                                        <span className="font-bold text-zinc-555 shrink-0">#{setIndex + 1}</span>
                                        {set.isDropSet && (
                                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">Drop</span>
                                        )}
                                        <span className="flex-1 text-left font-medium truncate">
                                          Target {displayReps}{isTimeBased ? "s" : " reps"} · {displayWeight === 0 ? "bodyweight" : `${displayWeight} ${exUnit}`}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void handleCompleteSet(set.id, set.completed);
                                          }}
                                          className="h-11 px-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer shrink-0 shadow-sm"
                                        >
                                          <Check size={15} className="stroke-[3px]" />
                                          Check
                                        </button>
                                      </div>
                                    );
                                  });
                                })()}

                                {/* Bottom action bar */}
                                <div className="mt-2.5 flex gap-2 flex-wrap">
                                  <Button
                                    size="sm" variant="ghost"
                                    className="text-xs font-bold text-zinc-750 hover:text-zinc-955 hover:bg-surface py-1.5 px-3 rounded-xl flex items-center gap-1.5 h-9 border border-surface-border active:scale-95 transition-all shadow-sm"
                                    icon={<Flame size={16} className="text-amber-500 animate-pulse" />}
                                    onClick={() => {
                                      const last = workoutExercise.sets.at(-1);
                                      if (!last) return;
                                      void updateSet(workoutExercise.id, last.id, { isDropSet: !last.isDropSet });
                                    }}
                                  >
                                    Dropset
                                  </Button>
                                  <Button
                                    size="sm" variant="ghost"
                                    className="text-xs font-bold text-zinc-750 hover:text-zinc-955 hover:bg-surface py-1.5 px-3 rounded-xl flex items-center gap-1.5 h-9 border border-surface-border active:scale-95 transition-all shadow-sm"
                                    icon={<Timer size={16} />}
                                    onClick={() => void startRestTimer(workoutExercise.restSeconds)}
                                  >
                                    Rest {Math.round(workoutExercise.restSeconds / 60)}m
                                  </Button>
                                </div>

                                {/* Plate loader + RIR advisor */}
                                {(() => {
                                  const isBarbell = exercise.equipment.includes("barbell");
                                  const activeSet = workoutExercise.sets.find(s => !s.completed) || workoutExercise.sets.at(-1);
                                  const activeWeight = activeSet?.weight || 0;
                                  const platesList = isBarbell && activeWeight ? calculatePlates(activeWeight, exUnit) : null;
                                  const lastDoneSet = [...workoutExercise.sets].reverse().find(s => s.completed);
                                  const rirVal = lastDoneSet?.rir;
                                  if (!platesList && rirVal === undefined) return null;

                                  const getPlateStyles = (plate: number) => {
                                    const p = Number(plate);
                                    if (p >= 45 || p === 25) return "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30";
                                    if (p === 35 || p === 20) return "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
                                    if (p === 25 || p === 15) return "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
                                    if (p === 10) return "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
                                    if (p === 5) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700";
                                    return "bg-zinc-900/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border-zinc-500/30";
                                  };

                                  return (
                                    <div className="mt-2.5 p-3.5 rounded-xl bg-surface/40 border border-surface-border space-y-3 text-xs select-none">
                                      {platesList && platesList.length > 0 && (
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-card-border pb-2.5">
                                          <div className="flex items-center gap-2 text-zinc-755 font-bold">
                                            <Dumbbell size={15} className="text-emerald-400 shrink-0" />
                                            <span>Plates per side ({activeWeight} {exUnit}):</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                                            {platesList.map((plate, idx) => (
                                              <span
                                                key={idx}
                                                className={cn(
                                                  "inline-flex items-center justify-center h-8 w-8 rounded-full border text-[10px] font-black font-mono shadow-sm transition-all",
                                                  getPlateStyles(plate)
                                                )}
                                              >
                                                {plate}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {rirVal !== undefined && (
                                        <div className={cn(
                                          "flex items-start gap-2.5 p-2.5 rounded-xl border select-none transition-all duration-300",
                                          rirVal <= 1
                                            ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 ring-1 ring-rose-500/10"
                                            : rirVal >= 4
                                            ? "bg-sky-500/5 dark:bg-sky-500/10 border-sky-500/20"
                                            : "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20"
                                        )}>
                                          <Sparkles size={14} className={cn(
                                            "mt-0.5 shrink-0",
                                            rirVal <= 1 ? "text-rose-500" : rirVal >= 4 ? "text-sky-500" : "text-emerald-500"
                                          )} />
                                          <div>
                                            <p className="font-extrabold text-foreground leading-tight text-[11px] uppercase tracking-wide">
                                              Stimulus Advisory (Set {workoutExercise.sets.findIndex(s => s.id === lastDoneSet?.id) + 1} · RIR {rirVal}):
                                            </p>
                                            <p className="text-zinc-600 dark:text-zinc-300 leading-normal mt-1 text-[11px] font-medium">
                                              {rirVal <= 1
                                                ? "Optimal hypertrophy threshold reached! Maintain weight or increase +2.5% next session."
                                                : rirVal >= 4
                                                ? "Low-intensity stimulus. Consider increasing load by 5–10% to target hypertrophy."
                                                : "Moderate stimulus — perfect sweet spot for safe progressive overload."}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        ) : (
                          /* Skipped warning */
                          <div className="mt-1 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 dark:border-amber-500/20 text-amber-700 dark:text-amber-200 text-xs">
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
                              <span>Progress Warning: Exercise Skipped</span>
                            </div>
                            <p className="text-zinc-750 leading-relaxed text-xs">
                              No machine or alternative available. Skipping reduces your weekly volume by{" "}
                              <span className="font-semibold text-zinc-900 dark:text-white">{workoutExercise.targetSets} sets</span> on{" "}
                              <span className="font-semibold text-zinc-900 dark:text-white capitalize">{exercise.muscles[0]}</span>, slowing adaptation.
                            </p>
                            <Button
                              size="sm" variant="secondary"
                              className="mt-2 text-xs w-full py-1 h-8 border-amber-500/25 dark:border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-200 hover:bg-amber-500/10"
                              onClick={() => void skipWorkoutExercise(workoutExercise.id)}
                            >
                              Resume Exercise
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="mt-8 mb-12 flex justify-center px-4">
        <Button
          variant="secondary"
          className="w-full max-w-md border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-350 py-2.5 h-11 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
          onClick={() => {
            if (window.confirm("Are you sure you want to discard this active workout? All tracked sets will be deleted and this session won't be saved in your history.")) {
              void discardWorkout();
            }
          }}
        >
          Discard Workout Session
        </Button>
      </div>

      {activeSwapExercise && originalEx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <Card className="w-full max-w-md p-5 space-y-4 relative flex flex-col max-h-[85vh] overflow-hidden border border-card-border shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-zinc-750 hover:text-zinc-955 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              onClick={() => {
                setActiveSwapExercise(null);
                setSwapSearch("");
              }}
              aria-label="Close swap options"
            >
              <X size={20} />
            </Button>

            <div>
              <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest leading-none">
                Alternative Selector
              </span>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-1 leading-snug">
                Swap "{originalEx.name}"
              </h2>
              <p className="text-zinc-750 text-xs mt-0.5 leading-normal">
                Choose an equipment-matched movement targeting the same <span className="font-semibold text-emerald-450 capitalize">{originalEx.muscles[0]}</span> group to keep your training plan active.
              </p>
            </div>

            {/* Modal search field */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-750" />
              <Input
                maxLength={100}
                placeholder="Search alternatives by name, equipment..."
                className="pl-9 h-9 text-xs rounded-xl bg-input border-input-border text-foreground focus:border-emerald-500"
                value={swapSearch}
                onChange={(e) => setSwapSearch(e.target.value)}
              />
            </div>

            {/* Alternatives scroll container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[50vh]">
              {alternatives.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs border border-dashed border-surface-border rounded-xl">
                  No matching exercises target the same muscle group. Try clearing your search parameters.
                </div>
              ) : (
                (() => {
                  const groups = [
                    { title: "⚡ Machine Alternatives", list: groupedAlternatives.machines },
                    { title: "🔌 Cable Alternatives", list: groupedAlternatives.cables },
                    { title: "🏋️ Free Weight Alternatives", list: groupedAlternatives.freeWeights },
                    { title: "🤸 Bodyweight Alternatives", list: groupedAlternatives.bodyweight },
                    { title: "📦 Other Movements", list: groupedAlternatives.others },
                  ].filter((g) => g.list.length > 0);

                  return groups.map((g) => (
                    <div key={g.title} className="space-y-1.5">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 select-none pl-1">
                        {g.title}
                      </h3>
                      <div className="grid gap-1.5">
                        {g.list.map((alt) => (
                          <button
                            key={alt.id}
                            className="w-full text-left p-2.5 rounded-xl border border-surface-border bg-surface/50 hover:bg-surface transition-all flex items-center justify-between group"
                            onClick={async () => {
                              await swapWorkoutExercise(activeSwapExercise.id, alt.id);
                              setActiveSwapExercise(null);
                              setSwapSearch("");
                            }}
                          >
                            <div>
                              <p className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors">
                                {alt.name}
                              </p>
                              <p className="text-xs text-zinc-555 capitalize mt-0.5">
                                {alt.muscles.slice(0, 3).join(", ")} · {alt.equipment.join(", ")}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-emerald-450 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 group-hover:bg-emerald-500/15 transition-all">
                              Swap
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Pre/Post checkin details overlay panels */}
      {selectedExercise ? (
        <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      ) : null}

      <PreWorkoutCheckinModal
        isOpen={showPreWorkoutModal}
        onClose={() => setShowPreWorkoutModal(false)}
        onConfirm={handlePreWorkoutConfirm}
      />

      <FinishSessionModal
        isOpen={showFinishSessionModal}
        onClose={() => setShowFinishSessionModal(false)}
        onConfirm={handleFinishSessionConfirm}
        onDiscard={handleFinishSessionDiscard}
        initialFatigue={fatigue}
        initialNotes={notes}
      />

      <PostWorkoutCheckinModal
        isOpen={showPostWorkoutModal}
        onClose={handlePostWorkoutClose}
        onConfirm={handlePostWorkoutConfirm}
        workoutNotes={notes}
      />
    </motion.div>
  );
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) {
    parts.push(hours.toString());
  }
  parts.push(minutes.toString().padStart(2, "0"));
  parts.push(seconds.toString().padStart(2, "0"));

  return parts.join(":");
}