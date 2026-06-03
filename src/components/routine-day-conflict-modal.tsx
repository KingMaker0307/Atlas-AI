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
      <Card className="w-full max-w-md p-5 space-y-3.5 relative flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl border border-card-border bg-card" role="dialog" aria-modal="true" aria-labelledby="conflict-modal-title">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
          onClick={onClose}
          aria-label="Close warning"
        >
          <X size={20} aria-hidden="true" />
        </Button>

        {/* Warning Icon Badge Header */}
        <div className="flex items-center gap-3 select-none">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span id="conflict-modal-title" className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest leading-none">
              Schedule Warning
            </span>
            <h2 className="text-lg font-bold text-foreground mt-0.5 leading-snug">
              Routine Day Mismatch
            </h2>
          </div>
        </div>

        <div className="space-y-3 pt-0.5 text-sm leading-relaxed text-zinc-650 dark:text-zinc-300">
          <p>
            "{routineName}" is scheduled for <span className="font-bold text-emerald-600 dark:text-emerald-400">{scheduledDay}</span>, but today is <span className="font-bold text-amber-600 dark:text-amber-400">{currentDay}</span>.
          </p>

          {hasConflictWithRoutine ? (
            <div className="p-3 rounded-xl bg-surface border border-surface-border text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground select-none">
                <CalendarRange size={14} className="text-zinc-500 dark:text-zinc-400" />
                <span>Reorganizing will update your schedule:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-zinc-500 dark:text-zinc-450">
                <li>
                  <span className="font-semibold text-foreground">"{routineName}"</span> will move to <span className="font-semibold text-foreground">{currentDay}</span> (Today).
                </li>
                <li>
                  <span className="font-semibold text-foreground">"{hasConflictWithRoutine}"</span> will move to <span className="font-semibold text-foreground">{scheduledDay}</span>.
                </li>
              </ul>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-surface border border-surface-border text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground select-none">
                <CalendarRange size={14} className="text-zinc-500 dark:text-zinc-400" />
                <span>Reorganizing will update your schedule:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-zinc-500 dark:text-zinc-455">
                <li>
                  <span className="font-semibold text-foreground">"{routineName}"</span> will move to <span className="font-semibold text-foreground">{currentDay}</span> (Today).
                </li>
                <li>
                  <span className="font-semibold text-foreground">{scheduledDay}</span> will become a <span className="font-semibold text-foreground">Rest Day</span>.
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1 select-none">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto order-3 sm:order-1 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={onStartAnyway}
            className="w-full sm:w-auto order-2 sm:order-2 font-semibold border-btn-secondary-border bg-btn-secondary hover:bg-btn-secondary-hover text-foreground"
          >
            Start Anyway
          </Button>
          <Button
            variant="primary"
            onClick={onReorganize}
            className="w-full sm:w-auto order-1 sm:order-3 font-bold bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center gap-1.5"
          >
            Reorganize & Start
          </Button>
        </div>
      </Card>
    </div>
  );
}
