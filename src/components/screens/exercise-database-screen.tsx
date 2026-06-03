"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Footprints,
  Heart,
  Layers3,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExerciseDetail } from "@/components/exercise-detail";
import { exercises } from "@/data/exercises";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Exercise } from "@/types/domain";

export function ExerciseDatabaseScreen() {
  const storeExercises = useAtlasStore((state) => state.exercises);
  const generateGlobalExercise = useAtlasStore((state) => state.generateGlobalExercise);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["compound", "isolation", "cardio", "mobility"])
  );

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

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6 pb-28"
    >
      {/* ─── Header & Back Navigation ─── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-xl"
            onClick={() => setActiveSubScreen(null)}
            aria-label="Back to workout plans"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <p className="text-sm text-zinc-555">
              Explore movement library & cues
            </p>
            <h1 className="mt-0.5 text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Exercise Library
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-bold text-zinc-600 dark:text-zinc-400">
          <Layers3 className="text-emerald-500" size={14} />
          <span>{filteredExercises.length} Exercises Loaded</span>
        </div>
      </section>

      {/* Info Card */}
      <Surface className="p-3.5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 text-zinc-750 dark:text-zinc-300 rounded-xl flex gap-3 items-start select-none">
        <Dumbbell size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-normal">
          Search the core biomechanics library below. Tap any exercise card to review clinical cues, correct setups, target muscles, and progressive overload guidelines.
        </p>
      </Surface>

      {/* ─── SEARCH & FILTER CONTAINER ─── */}
      <Card className="p-5 border border-card-border bg-card shadow-lg space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <Input
            maxLength={100}
            placeholder="Search by exercise name, muscle group, or equipment..."
            value={query}
            onChange={(event) => {
              const val = event.target.value;
              setQuery(val);
              // Auto-expand categories during search
              if (val.trim().length > 0) {
                setExpandedCategories(new Set(["compound", "isolation", "cardio", "mobility"]));
              }
            }}
            className="pl-10 pr-10"
          />
          {query.trim().length > 0 && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Categories accordion list */}
        <div className="space-y-3">
          {([
            { key: "compound", label: "Compound Movements", description: "Multi-joint compound lifts for strength & mass", icon: Dumbbell, color: "emerald" },
            { key: "isolation", label: "Isolation Exercises", description: "Single-joint targeted isolation work", icon: Target, color: "sky" },
            { key: "cardio", label: "Cardio & Conditioning", description: "Aerobic fitness, heart rate elevation & stamina", icon: Heart, color: "rose" },
            { key: "mobility", label: "Mobility & Stability", description: "Range of motion, dynamic activation & prehab", icon: Footprints, color: "violet" },
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
                icon: "text-emerald-450 dark:text-emerald-400",
                badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
              },
              sky: {
                bg: "bg-sky-500/10",
                border: "border-sky-500/20",
                text: "text-sky-400",
                icon: "text-sky-450 dark:text-sky-400",
                badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
              },
              rose: {
                bg: "bg-rose-500/10",
                border: "border-rose-500/20",
                text: "text-rose-400",
                icon: "text-rose-450 dark:text-rose-400",
                badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
              },
              violet: {
                bg: "bg-violet-500/10",
                border: "border-violet-500/20",
                text: "text-violet-400",
                icon: "text-violet-450 dark:text-violet-400",
                badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
              },
            };
            const c = colorMap[cat.color];

            return (
              <div key={cat.key} className="rounded-xl border border-surface-border bg-surface/40 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/[0.02] active:bg-white/[0.04] transition group"
                  onClick={() => toggleCategory(cat.key)}
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
                      className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-card-border p-3 bg-black/[0.04] dark:bg-white/[0.01]"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      {categoryExercises.map((exercise) => {
                        const diffColors = {
                          beginner: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/15",
                          intermediate: "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/15",
                          advanced: "bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/15",
                        };
                        const diffText = exercise.difficulty || "beginner";

                        return (
                          <button
                            className="rounded-lg border border-surface-border bg-surface/50 p-3 text-left transition hover:border-card-border/80 hover:bg-surface/85 active:scale-[0.99] flex flex-col justify-between gap-2.5 group cursor-pointer"
                            key={exercise.id}
                            onClick={() => setSelectedExercise(exercise)}
                          >
                            <div className="flex items-start justify-between w-full gap-2">
                              <div className="min-w-0">
                                <p className="text-[13px] font-bold text-foreground group-hover:text-emerald-650 dark:group-hover:text-emerald-400 transition-colors leading-snug truncate">
                                  {exercise.name}
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                                  {exercise.muscles.slice(0, 3).join(" · ")}
                                </p>
                              </div>
                              <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-white shrink-0 transition-colors self-center" />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded border ${diffColors[diffText]}`}>
                                {diffText}
                              </span>
                              {exercise.equipment.slice(0, 2).map((eq) => (
                                <span key={eq} className="px-1.5 py-0.5 rounded border border-surface-border bg-surface text-zinc-650 dark:text-zinc-450">
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

        {/* AI Generation fallback when search is empty */}
        {filteredExercises.length === 0 && query.trim().length > 2 && (
          <div className="mt-5 p-5 rounded-xl bg-surface border border-surface-border text-center space-y-3">
            <Sparkles className="h-8 w-8 text-emerald-400 mx-auto animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">Can&apos;t find &quot;{query}&quot;?</h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-450 mt-1 max-w-xs mx-auto leading-normal">
                Our biomechanics engine can dynamically generate a full clinical-grade exercise profile covering correct setup cues, execution, breathing, mistakes, and safety advice.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="text-xs bg-emerald-500 hover:bg-emerald-450 text-white font-bold"
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

      {selectedExercise ? (
        <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      ) : null}
    </motion.div>
  );
}
