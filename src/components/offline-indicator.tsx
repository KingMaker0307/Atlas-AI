"use client";

import { useEffect, useState } from "react";
import { CloudOff, Wifi } from "lucide-react";
import { cn } from "@/lib/cn";

export function OfflineIndicator() {
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
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        online
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
          : "border-amber-300/25 bg-amber-300/10 text-amber-200",
      )}
    >
      {online ? <Wifi size={14} /> : <CloudOff size={14} />}
      {online ? "Local ready" : "Offline"}
    </div>
  );
}
