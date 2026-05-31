"use client";

import { useEffect, useState } from "react";
import { CloudOff, Wifi } from "lucide-react";
import { cn } from "@/lib/cn";

export function OfflineIndicator({ compact = false }: { compact?: boolean }) {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg border text-xs font-medium transition-all duration-350 shrink-0 h-8",
        compact ? "w-8 p-0" : "px-3 py-1.5 gap-2",
        online
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
          : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-450",
      )}
      title={online ? "Atlas online & synced" : "Offline mode active"}
    >
      {online ? <Wifi size={14} className="shrink-0" /> : <CloudOff size={14} className="shrink-0" />}
      {!compact && (online ? "Local ready" : "Offline")}
    </div>
  );
}
