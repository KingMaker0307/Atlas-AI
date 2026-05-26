"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useAtlasStore } from "@/store/useAtlasStore";
import { 
  FileUp, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Dumbbell,
  Upload,
  ArrowLeft,
  ShieldAlert
} from "lucide-react";
import { useState, ChangeEvent } from "react";

type WelcomeView = "menu" | "backup";

export function WelcomeScreen() {
  const setStartupChoice = useAtlasStore((state) => state.setStartupChoice);
  const importEncryptedProfile = useAtlasStore((state) => state.importEncryptedProfile);

  const [view, setView] = useState<WelcomeView>("menu");
  
  // Backup upload states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPassphrase, setImportPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleImport = async () => {
    if (!importFile || !importPassphrase) return;
    setIsRestoring(true);
    setBackupError(null);
    try {
      const text = await importFile.text();
      await importEncryptedProfile(text, importPassphrase);
      // Upon successful decryption and restore, the state will hydrate and automatically transition to Dashboard
    } catch (e: any) {
      console.error("Backup decryption failed:", e);
      setBackupError(e.message || "Failed to decrypt or restore backup. Verify your passphrase and JSON file.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-start sm:justify-center bg-background p-4 py-8 sm:py-12 overflow-y-auto text-foreground selection:bg-emerald-300 selection:text-zinc-950">
      <Card className="w-full max-w-xl p-6 relative overflow-hidden shrink-0">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-zinc-950 shadow-[0_8px_20px_rgba(16,185,129,0.2)] mb-3">
            <Dumbbell size={26} className="text-zinc-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Welcome to Atlas</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">Your private offline-first fitness intelligence OS</p>
        </div>

        <AnimatePresence mode="wait">
          {view === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="space-y-3.5">
                <Button
                  className="w-full justify-start py-6 text-sm text-zinc-950 dark:text-zinc-950 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-450 dark:hover:bg-emerald-500"
                  variant="primary"
                  size="lg"
                  onClick={() => setStartupChoice("local")}
                >
                  <Sparkles className="mr-3 shrink-0 text-zinc-950" size={20} />
                  <div className="text-left">
                    <p className="font-bold text-xs sm:text-sm text-zinc-950">Start Fresh with AI Coach</p>
                    <p className="text-[9px] sm:text-[10px] opacity-85 font-medium text-zinc-905">Configure profile & setup AI assistant key (Gemini, OpenAI, Claude, etc.)</p>
                  </div>
                </Button>

                <Button
                  className="w-full justify-start py-6 text-sm"
                  variant="secondary"
                  size="lg"
                  onClick={() => setStartupChoice("local-offline")}
                >
                  <Dumbbell className="mr-3 text-emerald-500 dark:text-emerald-450 shrink-0" size={20} />
                  <div className="text-left">
                    <p className="font-bold text-xs sm:text-sm">Start Fresh (Offline Local Mode)</p>
                    <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">Train immediately with local storage. Skip AI configuration.</p>
                  </div>
                </Button>

                <Button
                  className="w-full justify-start py-6 text-sm"
                  variant="secondary"
                  size="lg"
                  onClick={() => setView("backup")}
                >
                  <FileUp className="mr-3 text-blue-400 shrink-0" size={20} />
                  <div className="text-left">
                    <p className="font-bold text-xs sm:text-sm">Load from Backup</p>
                    <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">Restore custom profiles from encrypted JSON backups</p>
                  </div>
                </Button>
              </div>
            </motion.div>
          )}

          {view === "backup" && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="space-y-1.5 border-b border-card-border pb-3 mb-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <FileUp className="text-blue-400" size={20} />
                  Restore training profile
                </h2>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Upload your encrypted JSON backup file and enter the decryption passphrase to restore your workouts, routines, and settings.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* File Uploader */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Select Backup File</Label>
                  <div className="relative">
                    <input
                      type="file"
                      id="welcome-import-file-uploader"
                      accept="application/json"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setImportFile(event.target.files?.[0] ?? null);
                        setBackupError(null);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="welcome-import-file-uploader"
                      className="flex items-center justify-center gap-2 border border-dashed border-card-border rounded-xl bg-input py-4 px-3 text-xs font-semibold text-zinc-400 hover:bg-input hover:text-foreground transition duration-200 cursor-pointer w-full text-center hover:border-blue-400/50"
                    >
                      <Upload size={16} className="text-blue-400" />
                      {importFile ? (
                        <span className="text-blue-600 dark:text-blue-300 font-bold truncate max-w-sm">
                          {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                        </span>
                      ) : (
                        <span>Choose backup.json file</span>
                      )}
                    </label>
                  </div>
                </div>

                {/* Passphrase Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Decryption Passphrase</Label>
                  <div className="relative">
                    <Input
                      type={showPassphrase ? "text" : "password"}
                      maxLength={64}
                      value={importPassphrase}
                      onChange={(event) => {
                        setImportPassphrase(event.target.value);
                        setBackupError(null);
                      }}
                      placeholder="Enter decrypt passphrase"
                      className="pr-10 focus:ring-2 focus:ring-blue-400/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {backupError && (
                  <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 text-rose-800 dark:text-rose-300 rounded-xl flex items-start gap-2.5">
                    <ShieldAlert size={16} className="mt-0.5 text-rose-750 dark:text-rose-400 shrink-0" />
                    <div className="space-y-1">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">Restore Failed</span>
                      <p className="text-[11px] leading-relaxed text-rose-950 dark:text-zinc-300">{backupError}</p>
                    </div>
                  </Surface>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 border-t border-card-border pt-4 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setView("menu");
                      setBackupError(null);
                      setImportFile(null);
                      setImportPassphrase("");
                    }}
                    icon={<ArrowLeft size={16} />}
                    disabled={isRestoring}
                  >
                    Back
                  </Button>
                  <Button
                    className="ml-auto"
                    variant="primary"
                    disabled={!importFile || !importPassphrase || isRestoring}
                    onClick={handleImport}
                    icon={isRestoring ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <FileUp size={16} />
                    )}
                  >
                    {isRestoring ? "Decrypting & Restoring..." : "Import Backup"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </main>
  );
}