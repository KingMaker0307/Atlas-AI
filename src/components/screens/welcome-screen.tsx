"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Cloud, FileUp, Sparkles } from "lucide-react";

export function WelcomeScreen() {
  const setStartupChoice = useAtlasStore((state) => state.setStartupChoice);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#07080a] p-4 text-white">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome to Atlas</h1>
          <p className="mt-2 text-zinc-400">Your AI-powered fitness coach</p>
        </div>
        <div className="mt-8 space-y-4">
          <Button
            className="w-full"
            variant="primary"
            size="lg"
            onClick={() => setStartupChoice("local")}
          >
            <Sparkles className="mr-2" size={18} />
            Start Fresh
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            size="lg"
            onClick={() => setStartupChoice("google-drive")}
          >
            <Cloud className="mr-2" size={18} />
            Sync from Google Drive
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            size="lg"
            onClick={() => setStartupChoice("backup")}
          >
            <FileUp className="mr-2" size={18} />
            Load from Backup
          </Button>
        </div>
      </Card>
    </main>
  );
}