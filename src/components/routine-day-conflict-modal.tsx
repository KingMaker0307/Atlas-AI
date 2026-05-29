"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CalendarRange, X } from "lucide-react";

interface RoutineDayConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineName: string;
  scheduledDay: string;
  currentDay: string;
  hasConflictWithRoutine?: string | null;
  onStartAnyway: () => void;
  onReorganize: () => void;
}

export function RoutineDayConflictModal({
  isOpen,
  onClose,
  routineName,
  scheduledDay,
  currentDay,
  hasConflictWithRoutine,
  onStartAnyway,
  onReorganize,
}: RoutineDayConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 pt-[max(1rem,env(safe-area-inset-top))] supports-[backdrop-filter]:backdrop-blur-md">
      <Card className="w-full max-w-md p-6 space-y-4 relative flex flex-col overflow-hidden shadow-2xl border border-card-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
          onClick={onClose}
          aria-label="Close warning"
        >
          <X size={20} />
        </Button>

        {/* Warning Icon Badge Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest leading-none">
              Schedule Conflict Warning
            </span>
            <h2 className="text-xl font-bold text-foreground mt-0.5 leading-snug">
              Routine Day Mismatch
            </h2>
          </div>
        </div>

        <div className="space-y-3 pt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <p>
            You are starting <span className="font-bold text-foreground">"{routineName}"</span>, which is scheduled for <span className="font-bold text-emerald-600 dark:text-emerald-400">{scheduledDay}</span>. 
            However, today is <span className="font-bold text-amber-600 dark:text-amber-400">{currentDay}</span>.
          </p>

          {hasConflictWithRoutine ? (
            <div className="p-3.5 rounded-xl bg-surface border border-surface-border text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <CalendarRange size={14} className="text-zinc-500 dark:text-zinc-400" />
                <span>Automated Reorganization Plan:</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 leading-normal">
                To keep your training plan organized, selecting **Reorganize & Start** will automatically swap these routines:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>
                  <span className="font-semibold text-foreground">"{routineName}"</span> will move to <span className="font-semibold text-foreground">{currentDay}</span> (Today).
                </li>
                <li>
                  <span className="font-semibold text-foreground">"{hasConflictWithRoutine}"</span> (originally scheduled for today) will move to <span className="font-semibold text-foreground">{scheduledDay}</span>.
                </li>
              </ul>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-surface border border-surface-border text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <CalendarRange size={14} className="text-zinc-500 dark:text-zinc-400" />
                <span>Training Schedule Move:</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 leading-normal">
                Today is a **Rest Day**. Choosing **Reorganize & Start** will update your weekly calendar:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>
                  <span className="font-semibold text-foreground">"{routineName}"</span> will move to <span className="font-semibold text-foreground">{currentDay}</span> (Today).
                </li>
                <li>
                  <span className="font-semibold text-foreground">{scheduledDay}</span> will become your new **Rest Day** for this cycle.
                </li>
              </ul>
            </div>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 leading-normal italic">
            Note: Moving or reorganizing schedules ensures that your weekly streaks, monthly consistency ratings, and target volume allocations are calculated with 100% accuracy.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
          <Button
            variant="primary"
            onClick={onReorganize}
            className="w-full font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center gap-1.5"
          >
            Reorganize & Start
          </Button>
          <Button
            variant="secondary"
            onClick={onStartAnyway}
            className="w-full font-semibold border-btn-secondary-border bg-btn-secondary hover:bg-btn-secondary-hover text-foreground"
          >
            Start Anyway
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
