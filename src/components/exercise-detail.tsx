"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import type { Exercise } from "@/types/domain";

export function ExerciseDetail({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 pt-[max(1rem,env(safe-area-inset-top))] supports-[backdrop-filter]:backdrop-blur-md">
      <Card className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">
              {exercise.category} · {exercise.difficulty}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{exercise.name}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {exercise.muscles.join(", ")} · {exercise.equipment.join(", ")}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close exercise detail">
            <X size={20} />
          </Button>
        </div>
        <div className="space-y-3 overflow-y-auto p-4">
          <Surface className="aspect-video border-dashed border-emerald-300/20 bg-emerald-300/8 p-0">
            <div className="flex h-full items-center justify-center text-sm text-emerald-100">
              Video and image placeholder
            </div>
          </Surface>
          <DetailSection title="Setup" items={exercise.setup} />
          <DetailSection title="Execution" items={exercise.execution} />
          <Surface>
            <h3 className="font-semibold text-white">Breathing</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{exercise.breathing}</p>
          </Surface>
          <Surface>
            <h3 className="font-semibold text-white">Tempo</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{exercise.tempo}</p>
          </Surface>
          <DetailSection title="Common mistakes" items={exercise.commonMistakes} />
          <DetailSection title="Safety" items={exercise.safetyTips} />
          <DetailSection title="Progression" items={exercise.progressionTips} />
        </div>
      </Card>
    </div>
  );
}

function DetailSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Surface>
      <h3 className="font-semibold text-white">{title}</h3>
      <ol className="mt-2 space-y-2 text-sm leading-6 text-zinc-300">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </Surface>
  );
}
