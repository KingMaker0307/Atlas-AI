"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt({ compact = false }: { compact?: boolean }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!promptEvent) return null;

  return (
    <Button
      size={compact ? "icon" : "sm"}
      variant="primary"
      icon={<Download size={14} className="shrink-0" />}
      onClick={async () => {
        await promptEvent.prompt();
        setPromptEvent(null);
      }}
      className={compact ? "h-8 w-8 rounded-lg" : ""}
      title="Install App"
    >
      {!compact && "Install"}
    </Button>
  );
}
