import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Check, X, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FinishSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fatigueRating: number, workoutNotes: string) => void;
  initialFatigue: number;
  initialNotes: string;
  incompleteCount?: number;
}

const FATIGUE_CONFIG: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😎", label: "Fresh", color: "text-emerald-500" },
  2: { emoji: "😊", label: "Great", color: "text-emerald-500" },
  3: { emoji: "🙂", label: "Good", color: "text-emerald-400" },
  4: { emoji: "😐", label: "Moderate", color: "text-yellow-500" },
  5: { emoji: "😐", label: "Moderate", color: "text-yellow-500" },
  6: { emoji: "😓", label: "Fatigued", color: "text-amber-500" },
  7: { emoji: "😰", label: "Tired", color: "text-amber-500" },
  8: { emoji: "🥵", label: "Very Tired", color: "text-orange-500" },
  9: { emoji: "😵", label: "Exhausted", color: "text-rose-500" },
  10: { emoji: "💀", label: "Destroyed", color: "text-rose-600" },
};

export function FinishSessionModal({
  isOpen,
  onClose,
  onConfirm,
  initialFatigue,
  initialNotes,
  incompleteCount,
}: FinishSessionModalProps) {
  const [fatigue, setFatigue] = useState(initialFatigue || 5);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFatigue(initialFatigue || 5);
      setNotes(initialNotes);
      setError(null);
    }
  }, [isOpen, initialFatigue, initialNotes]);

  const handleNotesChange = useCallback((val: string) => {
    setNotes(val);
    if (val.length > 250) {
      setError("Notes must be 250 characters or less.");
    } else {
      setError(null);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (notes.length > 250) {
      setError("Notes must be 250 characters or less.");
      return;
    }
    onConfirm(fatigue, notes);
    onClose();
  }, [fatigue, notes, onConfirm, onClose]);

  if (!isOpen) return null;

  const fatigueInfo = FATIGUE_CONFIG[fatigue] || FATIGUE_CONFIG[5];

  // Gradient stops for the slider track: green → yellow → orange → red
  const trackGradient = "linear-gradient(to right, #10b981 0%, #10b981 20%, #eab308 40%, #f59e0b 60%, #f97316 75%, #ef4444 100%)";
  const progressPercent = ((fatigue - 1) / 9) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <Card
        className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl rounded-b-none p-0 relative max-h-[90vh] overflow-y-auto shadow-2xl border border-card-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-session-title"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-card-border/60">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Session Complete</span>
              <h2 id="finish-session-title" className="text-lg font-bold text-foreground leading-snug mt-0.5">
                Finish Workout
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Incomplete Exercises Warning */}
          {incompleteCount !== undefined && incompleteCount > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Incomplete Exercises</h4>
                <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-0.5 leading-snug">
                  You still have {incompleteCount} exercise{incompleteCount > 1 ? "s" : ""} with incomplete sets. If you finish now, incomplete sets will be lost.
                </p>
              </div>
            </div>
          )}

          {/* Fatigue Slider */}
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-750 tracking-wider mb-3">
              How fatigued do you feel?
            </label>

            {/* Emoji + Label display */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl transition-all duration-300" role="img" aria-label={fatigueInfo.label}>
                {fatigueInfo.emoji}
              </span>
              <div className="text-center">
                <span className={`text-2xl font-black tabular-nums ${fatigueInfo.color}`}>
                  {fatigue}
                </span>
                <span className="text-xs text-zinc-500 font-bold ml-1">/10</span>
                <p className={`text-xs font-bold ${fatigueInfo.color} mt-0.5`}>
                  {fatigueInfo.label}
                </p>
              </div>
            </div>

            {/* Slider */}
            <div className="relative px-1">
              {/* Track background */}
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: "var(--color-surface-border, #27272a)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${progressPercent}%`,
                    background: trackGradient,
                  }}
                />
              </div>
              {/* Native range input overlay */}
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={fatigue}
                onChange={(e) => setFatigue(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ touchAction: "manipulation" }}
                aria-label="Fatigue rating"
              />
              {/* Custom thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150"
                style={{ left: `calc(${progressPercent}% - 10px)` }}
              >
                <div className="h-5 w-5 rounded-full bg-white border-2 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20" />
              </div>
            </div>

            {/* Scale labels */}
            <div className="flex justify-between mt-1.5 px-0.5">
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Fresh</span>
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Destroyed</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="finish-notes" className="block text-[10px] font-black uppercase text-zinc-750 tracking-wider mb-1.5">
              Notes <span className="text-zinc-500 font-medium normal-case">({notes.length}/250)</span>
            </label>
            <Textarea
              id="finish-notes"
              value={notes}
              maxLength={250}
              placeholder="How did you feel? Any adjustments for next time..."
              onChange={(e) => handleNotesChange(e.target.value)}
              className="min-h-[80px] text-sm bg-surface border-surface-border rounded-xl resize-none"
            />
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{error}</p>}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-2 space-y-2.5">
          {/* Primary: Save & Finish */}
          <button
            type="button"
            disabled={!!error}
            onClick={handleConfirm}
            className="w-full h-12 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} className="stroke-[3px]" />
            Save & Finish
          </button>

          {/* Secondary: Cancel (just closes modal) */}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer border border-surface-border"
          >
            Cancel
          </button>
        </div>
      </Card>
    </div>
  );
}