"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Save, Trash2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { exercises } from "@/data/exercises";
import { createId } from "@/lib/id";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Routine } from "@/types/domain";

interface RoutineBuilderProps {
  onClose: () => void;
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function RoutineBuilderScreen({ onClose }: RoutineBuilderProps) {
  const saveRoutines = useAtlasStore((state) => state.saveRoutines);
  const [days, setDays] = useState<Routine[]>([
    {
      id: createId("day"),
      name: "Day 1: Push",
      exercises: [],
      focus: "Manual",
      estimatedMinutes: 60,
      days: ["Monday"],
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExercises = useMemo(() => {
    if (!searchTerm) return exercises;
    return exercises.filter((ex) =>
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const addDay = () => {
    const nextDayIndex = days.length % 7;
    setDays([
      ...days,
      {
        id: createId("day"),
        name: `Day ${days.length + 1}`,
        exercises: [],
        focus: "Manual",
        estimatedMinutes: 60,
        days: [weekDays[nextDayIndex]],
      },
    ]);
  };

  const removeDay = (dayId: string) => {
    setDays(days.filter((day) => day.id !== dayId));
  };

  const addExercise = (dayId: string, exerciseId: string) => {
    setDays(
      days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                { exerciseId, targetSets: 3, targetReps: "8-12", restSeconds: 90 },
              ],
            }
          : day,
      ),
    );
  };

  const removeExercise = (dayId: string, exerciseIndex: number) => {
    setDays(
      days.map((day) =>
        day.id === dayId
          ? { ...day, exercises: day.exercises.filter((_, i) => i !== exerciseIndex) }
          : day,
      ),
    );
  };

  const handleSave = async () => {
    await saveRoutines(days);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 p-4"
    >
      <Card className="mx-auto h-full max-w-2xl overflow-y-auto p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Routine Builder</h1>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {days.map((day, dayIndex) => (
            <Surface key={day.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <Input
                  className="text-lg font-semibold"
                  value={day.name}
                  onChange={(e) =>
                    setDays(
                      days.map((d) => (d.id === day.id ? { ...d, name: e.target.value } : d)),
                    )
                  }
                />
                <Select
                  value={day.days[0]}
                  onChange={(e) => {
                    const newDays = [...days];
                    newDays[dayIndex].days = [e.target.value];
                    setDays(newDays);
                  }}
                >
                  {weekDays.map((wd) => (
                    <option key={wd} value={wd}>
                      {wd}
                    </option>
                  ))}
                </Select>
                <Button size="icon" variant="danger" onClick={() => removeDay(day.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {day.exercises.map((ex, exIndex) => (
                  <div key={exIndex} className="flex items-center gap-2">
                    <p className="flex-1 text-sm">
                      {exercises.find((e) => e.id === ex.exerciseId)?.name}
                    </p>
                    <Input
                      className="w-20"
                      value={ex.targetSets}
                      onChange={(e) => {
                        const newDays = [...days];
                        newDays[dayIndex].exercises[exIndex].targetSets = Number(e.target.value);
                        setDays(newDays);
                      }}
                    />
                    <Input
                      className="w-24"
                      value={ex.targetReps}
                      onChange={(e) => {
                        const newDays = [...days];
                        newDays[dayIndex].exercises[exIndex].targetReps = e.target.value;
                        setDays(newDays);
                      }}
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeExercise(day.id, exIndex)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <Label>Add Exercise</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addExercise(day.id, e.target.value);
                        setSearchTerm("");
                      }
                    }}
                  >
                    <option value="" disabled>
                      Select an exercise
                    </option>
                    {filteredExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Surface>
          ))}

          <Button className="w-full" variant="secondary" onClick={addDay} icon={<Plus size={16} />}>
            Add Day
          </Button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="lg" onClick={handleSave} icon={<Save size={16} />}>
            Save Routine
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}