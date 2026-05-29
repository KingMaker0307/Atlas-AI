import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Clock3, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FinishSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fatigueRating: number, workoutNotes: string) => void;
  onDiscard: () => void;
  initialFatigue: number;
  initialNotes: string;
}

export function FinishSessionModal({
  isOpen,
  onClose,
  onConfirm,
  onDiscard,
  initialFatigue,
  initialNotes,
}: FinishSessionModalProps) {
  const [fatigue, setFatigue] = useState(initialFatigue);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFatigue(initialFatigue);
      setNotes(initialNotes);
      setError(null);
    }
  }, [isOpen, initialFatigue, initialNotes]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (val.length > 250) {
      setError("Notes must be 250 characters or less.");
    } else if (fatigue < 1 || fatigue > 10 || isNaN(fatigue)) {
      setError("Fatigue rating must be between 1 and 10.");
    } else {
      setError(null);
    }
  };

  const handleFatigueChange = (val: string) => {
    const num = Number(val);
    setFatigue(num);
    if (notes.length > 250) {
      setError("Notes must be 250 characters or less.");
    } else if (isNaN(num) || num < 1 || num > 10) {
      setError("Fatigue rating must be between 1 and 10.");
    } else {
      setError(null);
    }
  };

  const handleConfirm = () => {
    if (notes.length > 250) {
      setError("Notes must be 250 characters or less.");
      return;
    }
    if (isNaN(fatigue) || fatigue < 1 || fatigue > 10) {
      setError("Fatigue rating must be between 1 and 10.");
      return;
    }
    onConfirm(fatigue, notes);
    onClose();
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
  };

  if (!isOpen) return null; // Conditional rendering for the modal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-md p-6 relative" role="dialog" aria-modal="true" aria-labelledby="finish-session-title">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 id="finish-session-title" className="text-lg font-semibold leading-none tracking-tight text-foreground">Finish Session</h2>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5" onClick={onClose} aria-label="Close modal">
            <X size={20} aria-hidden="true" />
          </Button>
        </div>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              maxLength={250}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fatigue" className="text-right">
              Fatigue (1-10)
            </Label>
            <Input
              id="fatigue"
              type="number"
              min={1}
              max={10}
              value={fatigue || ""}
              onChange={(e) => handleFatigueChange(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDiscard}>
            Discard
          </Button>
          <Button variant="primary" icon={<Clock3 size={16} />} disabled={!!error} onClick={handleConfirm}>
            Finish
          </Button>
        </div>
      </Card>
    </div>
  );
}