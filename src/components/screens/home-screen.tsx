"use client";

import { useEffect } from "react";
import { TodayScreen } from "./today-screen";

export function HomeScreen() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, []);

  return (
    <div className="space-y-6">
      <TodayScreen />
    </div>
  );
}
