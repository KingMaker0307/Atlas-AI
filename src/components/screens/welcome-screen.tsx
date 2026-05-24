"use client";

import { motion } from "framer-motion";
import { ArrowRight, Cloudy, Dumbbell, Upload } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useAtlasStore } from "@/store/useAtlasStore";

interface WelcomeScreenProps {
  onStartLocal: () => void;
}

export function WelcomeScreen({ onStartLocal }: WelcomeScreenProps) {
  const linkGoogleDrive = useAtlasStore((state) => state.linkGoogleDrive);
  const importEncryptedProfile = useAtlasStore((state) => state.importEncryptedProfile);
  const isGisInitialized = useAtlasStore((state) => state.isGisInitialized);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPassphrase, setImportPassphrase] = useState("");

  async function handleImport() {
    if (!importFile || !importPassphrase) return;
    const text = await importFile.text();
    await importEncryptedProfile(text, importPassphrase);
  }

  return (
    <main className="min-h-dvh bg-[#07080a] px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-zinc-950">
            <Dumbbell size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-200">Local-first fitness OS</p>
            <h1 className="text-3xl font-semibold tracking-normal">Atlas AI Coach</h1>
          </div>
        </div>

        <Card className="p-4">
          <h2 className="text-lg font-semibold text-white">Get Started</h2>
          <p className="mb-4 text-sm text-zinc-400">How would you like to store your data?</p>

          <div className="space-y-3">
            <Button
              className="w-full"
              variant="primary"
              size="lg"
              icon={<Cloudy size={16} />}
              onClick={() => void linkGoogleDrive()}
              disabled={!isGisInitialized}
            >
              Sync with Google Drive
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              size="lg"
              icon={<ArrowRight size={16} />}
              onClick={onStartLocal}
            >
              Start Fresh (Local Only)
            </Button>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <h3 className="font-semibold text-white">Or Restore Backup</h3>
            <div className="mt-3 space-y-3">
              <div>
                <Label>Import file</Label>
                <Input
                  type="file"
                  accept="application/json"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setImportFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>
              <div>
                <Label>Import passphrase</Label>
                <Input
                  type="password"
                  value={importPassphrase}
                  onChange={(event) => setImportPassphrase(event.target.value)}
                />
              </div>
              <Button
                className="w-full"
                icon={<Upload size={16} />}
                disabled={!importFile || !importPassphrase}
                onClick={() => void handleImport()}
              >
                Import Profile
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}