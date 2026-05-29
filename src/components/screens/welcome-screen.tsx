"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useAtlasStore } from "@/store/useAtlasStore";
import { createId } from "@/lib/id";
import { 
  FileUp, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Dumbbell,
  Upload,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Bot,
  Flame
} from "lucide-react";
import { useState, ChangeEvent } from "react";

type WelcomeView = "menu" | "backup" | "setup";

const providerTypes = [
  "gemini",
  "openai",
  "anthropic",
  "grok",
  "deepseek",
  "openrouter",
  "ollama",
  "lmstudio",
  "custom",
] as const;

function getProviderInstructions(provider: string) {
  switch (provider) {
    case "openai":
      return {
        title: "OpenAI Configuration",
        steps: [
          "Sign in to your account at platform.openai.com.",
          "Go to API Keys on the left sidebar navigation.",
          "Click '+ Create new secret key' and select permissions.",
          "Copy the key (starts with 'sk-') and paste it below."
        ],
        url: "https://platform.openai.com/api-keys"
      };
    case "anthropic":
      return {
        title: "Anthropic Configuration",
        steps: [
          "Log in to the console at console.anthropic.com.",
          "Click on 'API Keys' in your dashboard.",
          "Generate a new secret key, naming it appropriately.",
          "Copy the key (starts with 'sk-ant-') and paste it below."
        ],
        url: "https://console.anthropic.com/"
      };
    case "gemini":
      return {
        title: "Google Gemini Configuration",
        steps: [
          "Navigate to Google AI Studio at aistudio.google.com.",
          "Sign in with your Google account.",
          "Click on the 'Get API key' button in the upper left.",
          "Click 'Create API key' and copy it."
        ],
        url: "https://aistudio.google.com/"
      };
    case "grok":
      return {
        title: "xAI Grok Configuration",
        steps: [
          "Go to the xAI Console at console.x.ai.",
          "Select API Keys from the sidebar navigation.",
          "Click 'Create API Key' and copy it."
        ],
        url: "https://console.x.ai/"
      };
    case "deepseek":
      return {
        title: "DeepSeek Configuration",
        steps: [
          "Sign in to platform.deepseek.com.",
          "Navigate to 'API Keys' in the menu sidebar.",
          "Click 'Create new API key', choose a name, and copy it."
        ],
        url: "https://platform.deepseek.com/"
      };
    case "openrouter":
      return {
        title: "OpenRouter Configuration",
        steps: [
          "Go to openrouter.ai and log in.",
          "Select 'Keys' and click 'Create Key'.",
          "Copy the generated key (starts with 'sk-or-') and paste it below."
        ],
        url: "https://openrouter.ai/keys"
      };
    case "ollama":
      return {
        title: "Ollama Local Configuration",
        steps: [
          "Ensure Ollama is downloaded and running on your local machine.",
          "Ensure you have pulled a model (e.g., run 'ollama run llama3' in terminal).",
          "The default local server address is http://localhost:11434.",
          "No API Key is required. You can leave the API key field blank."
        ],
        url: "https://ollama.com"
      };
    case "lmstudio":
      return {
        title: "LM Studio Local Configuration",
        steps: [
          "Open LM Studio on your local machine.",
          "Go to the Local Server tab (double-headed arrow icon).",
          "Select and load a GGUF model in the top dropdown.",
          "Click 'Start Server' (it defaults to port 1234).",
          "No API Key is required. You can leave the API key field blank."
        ],
        url: "https://lmstudio.ai"
      };
    default:
      return null;
  }
}

export function WelcomeScreen() {
  const setStartupChoice = useAtlasStore((state) => state.setStartupChoice);
  const completeOnboarding = useAtlasStore((state) => state.completeOnboarding);
  const importEncryptedProfile = useAtlasStore((state) => state.importEncryptedProfile);

  const [view, setView] = useState<WelcomeView>("menu");
  
  // Backup upload states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPassphrase, setImportPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Setup form states
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(28);
  const [weight, setWeight] = useState<number>(160);
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [height, setHeight] = useState<number>(68); // total inches or cm
  const [heightUnit, setHeightUnit] = useState<"in" | "cm">("in");
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [trainingStyle, setTrainingStyle] = useState<"strength" | "hypertrophy" | "powerbuilding" | "endurance" | "general">("general");
  const [equipment, setEquipment] = useState<"full gym" | "home gym" | "bodyweight">("full gym");
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [bodyType, setBodyType] = useState<"ectomorph" | "mesomorph" | "endomorph">("mesomorph");
  const [targetPhysique, setTargetPhysique] = useState<"lean" | "athletic" | "bulky" | "shredded" | "toned">("athletic");

  // AI Setup states
  const [setupAiCoach, setSetupAiCoach] = useState(false);
  const [providerType, setProviderType] = useState<typeof providerTypes[number]>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleWeightUnitChange = (unit: "lbs" | "kg") => {
    if (weightUnit !== unit) {
      setWeightUnit(unit);
      if (weight) {
        if (unit === "lbs") {
          setWeight(Math.round(weight * 2.20462 * 10) / 10);
        } else {
          setWeight(Math.round((weight / 2.20462) * 10) / 10);
        }
      }
    }
  };

  const handleHeightUnitChange = (unit: "in" | "cm") => {
    if (heightUnit !== unit) {
      setHeightUnit(unit);
      if (height) {
        if (unit === "in") {
          setHeight(Math.round(height / 2.54));
        } else {
          setHeight(Math.round(height * 2.54));
        }
      }
    }
  };

  const handleImport = async () => {
    if (!importFile || !importPassphrase) return;
    setIsRestoring(true);
    setBackupError(null);
    try {
      const text = await importFile.text();
      await importEncryptedProfile(text, importPassphrase);
    } catch (e: any) {
      console.error("Backup decryption failed:", e);
      setBackupError(e.message || "Failed to decrypt or restore backup. Verify your passphrase and JSON file.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError("Please enter a preferred name.");
      return;
    }
    if (isNaN(age) || age < 13 || age > 120) {
      setSubmitError("Age must be between 13 and 120.");
      return;
    }
    if (isNaN(weight) || weight < 20 || weight > 1000) {
      setSubmitError("Weight must be between 20 and 1000.");
      return;
    }
    if (isNaN(height) || height < 20 || height > 300) {
      setSubmitError("Height must be between 20 and 300.");
      return;
    }
    if (isNaN(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
      setSubmitError("Frequency must be between 1 and 7 days per week.");
      return;
    }
    
    if (setupAiCoach && !apiKey.trim() && providerType !== "ollama" && providerType !== "lmstudio") {
      setSubmitError(`Please provide an API key for ${providerType.toUpperCase()}, or disable the AI Coach assistant toggle.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await completeOnboarding({
        id: createId("user"),
        name: name.trim(),
        goal: goal.trim() || "General Fitness",
        customGoal: goal.trim() || "General Fitness",
        age,
        weight,
        height,
        weightUnit,
        heightUnit,
        bodyType,
        targetPhysique,
        experience,
        trainingStyle,
        daysPerWeek,
        equipment,
        providerType: setupAiCoach ? providerType : "none",
        apiKey: setupAiCoach ? apiKey : "",
        workoutDuration: 60,
        createdAt: new Date().toISOString(),
      });
      setStartupChoice("local");
    } catch (e: any) {
      console.error("Onboarding setup failed:", e);
      setSubmitError(e.message || "Failed to finalize profile. Please check API key or server configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-start sm:justify-center bg-background p-4 py-8 sm:py-12 overflow-y-auto text-foreground selection:bg-emerald-300 selection:text-zinc-950">
      <Card className={`w-full transition-all duration-300 p-6 relative overflow-hidden shrink-0 ${view === "setup" ? "max-w-3xl" : "max-w-xl"}`}>
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        {/* App Logo & Header */}
        <div className="text-center mb-6 select-none">
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
              className="space-y-6"
            >
              <div className="text-center space-y-1 mb-4 select-none">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Flame size={14} className="text-emerald-400 animate-pulse" />
                  Atlas AI Fitness OS
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Begin your private fitness journey. Select how you want to configure your localized database.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setName("");
                    setAge(28);
                    setWeight(165);
                    setHeight(70);
                    setExperience("beginner");
                    setBodyType("mesomorph");
                    setTargetPhysique("athletic");
                    setGoal("Build strength and muscle size");
                    setDaysPerWeek(3);
                    setWeightUnit("lbs");
                    setHeightUnit("in");
                    setSetupAiCoach(true);
                    setView("setup");
                  }}
                  className="flex items-start text-left p-5 rounded-2xl border border-emerald-500/15 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/40 transition-all duration-200 group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-12 -bottom-12 h-24 w-24 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-xl pointer-events-none group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 transition-all" />
                  
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mr-4 shadow-sm border border-emerald-500/20">
                    <Sparkles size={20} className="stroke-[2.5]" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      Start Fresh / Custom Setup
                      <ArrowRight size={14} className="text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Set up your name, units, training goals, frequency, and customize your AI key directly for a personalized start.
                    </p>
                  </div>
                </button>

                {/* 2. Load Backup */}
                <button
                  type="button"
                  onClick={() => setView("backup")}
                  className="flex items-start text-left p-5 rounded-2xl border border-blue-500/15 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5 hover:bg-blue-50/80 dark:hover:bg-blue-500/10 hover:border-blue-500/30 dark:hover:bg-blue-500/40 transition-all duration-200 group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-12 -bottom-12 h-24 w-24 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-xl pointer-events-none group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-all" />
                  
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mr-4 shadow-sm border border-blue-500/20">
                    <FileUp size={20} className="stroke-[2.5]" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                      Load from Backup File
                      <ArrowRight size={14} className="text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Restore workouts, history, routines, and custom settings from an encrypted backup JSON file.
                    </p>
                  </div>
                </button>
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
              className="space-y-4 text-left"
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
                      className="pr-10 focus:ring-2 focus:ring-blue-400/10 text-xs font-medium"
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

          {view === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 text-left animate-fadeIn"
            >
              <div className="space-y-1.5 border-b border-card-border pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="text-emerald-500 dark:text-emerald-400" size={20} />
                    Profile & AI Coach Setup
                  </h2>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Enter your biometrics and training preferences. Your data is stored locally and securely.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSetupSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Biometrics */}
                  <div className="space-y-4 bg-card p-5 border border-card-border rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-surface-border pb-2.5 mb-2.5">
                      1. Biometrics & Preferences
                    </h3>
                    
                    <div>
                      <Label htmlFor="setup-name" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Preferred Name</Label>
                      <Input
                        id="setup-name"
                        maxLength={30}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jordan"
                        className="mt-1 text-xs font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="setup-age" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Age</Label>
                        <Input
                          id="setup-age"
                          type="number"
                          min={13}
                          max={120}
                          value={age || ""}
                          onChange={(e) => setAge(Number(e.target.value))}
                          placeholder="e.g. 28"
                          className="mt-1 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <Label htmlFor="setup-physique" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target Physique</Label>
                        <Select
                          id="setup-physique"
                          value={targetPhysique}
                          onChange={(e: any) => setTargetPhysique(e.target.value)}
                          className="mt-1 text-xs font-bold"
                        >
                          <option value="lean">Lean</option>
                          <option value="athletic">Athletic</option>
                          <option value="bulky">Bulky</option>
                          <option value="shredded">Shredded</option>
                          <option value="toned">Toned</option>
                        </Select>
                      </div>
                    </div>

                    {/* Weight Field with Units inline */}
                    <div className="space-y-1">
                      <Label htmlFor="setup-weight" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Weight</Label>
                      <div className="flex gap-2">
                        <Input
                          id="setup-weight"
                          type="number"
                          min={20}
                          max={1000}
                          value={weight || ""}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          placeholder="Weight"
                          className="text-xs font-mono font-bold flex-1"
                        />
                        <div className="grid grid-cols-2 gap-1 rounded-xl border border-surface-border bg-surface p-1 shrink-0 w-28 select-none">
                          {(["lbs", "kg"] as const).map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => handleWeightUnitChange(unit)}
                              className={`rounded-lg py-1 text-[10px] font-bold uppercase transition ${
                                weightUnit === unit
                                  ? "bg-emerald-500 text-white-keep shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                              }`}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Height Field with Units inline */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Height</Label>
                      <div className="flex gap-2">
                        {heightUnit === "in" ? (
                          <div className="grid grid-cols-2 gap-2 flex-1">
                            <Input
                              type="number"
                              min={2}
                              max={8}
                              placeholder="Ft"
                              value={height ? Math.floor(height / 12) : ""}
                              onChange={(e) => {
                                const feet = Number(e.target.value);
                                const inches = height % 12 || 0;
                                setHeight(feet * 12 + inches);
                              }}
                              className="text-xs font-mono font-bold text-center"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={11}
                              placeholder="In"
                              value={height ? Math.round(height % 12) : ""}
                              onChange={(e) => {
                                const inches = Number(e.target.value);
                                const feet = Math.floor(height / 12) || 5;
                                setHeight(feet * 12 + inches);
                              }}
                              className="text-xs font-mono font-bold text-center"
                            />
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min={20}
                            max={300}
                            value={height || ""}
                            onChange={(e) => setHeight(Number(e.target.value))}
                            placeholder="e.g. 178"
                            className="text-xs font-mono font-bold flex-1"
                          />
                        )}
                        <div className="grid grid-cols-2 gap-1 rounded-xl border border-surface-border bg-surface p-1 shrink-0 w-28 select-none">
                          {(["in", "cm"] as const).map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => handleHeightUnitChange(unit)}
                              className={`rounded-lg py-1 text-[10px] font-bold uppercase transition ${
                                heightUnit === unit
                                  ? "bg-emerald-500 text-white-keep shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                              }`}
                            >
                              {unit === "in" ? "ft" : "cm"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Training Targets */}
                  <div className="space-y-4 bg-card p-5 border border-card-border rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-surface-border pb-2.5 mb-2.5">
                      2. Training Program Options
                    </h3>
                    
                    <div>
                      <Label htmlFor="setup-goal" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Workout Goal</Label>
                      <Textarea
                        id="setup-goal"
                        maxLength={120}
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., Build strength and muscle size"
                        className="mt-1 text-xs font-medium h-16 min-h-[4rem]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="setup-frequency" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Frequency (Days/Wk)</Label>
                        <Input
                          id="setup-frequency"
                          type="number"
                          min={1}
                          max={7}
                          value={daysPerWeek || ""}
                          onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                          placeholder="e.g. 3"
                          className="mt-1 text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <Label htmlFor="setup-style" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Methodology</Label>
                        <Select
                          id="setup-style"
                          value={trainingStyle}
                          onChange={(e: any) => setTrainingStyle(e.target.value)}
                          className="mt-1 text-xs font-bold"
                        >
                          <option value="general">General Fitness</option>
                          <option value="strength">Strength Focus</option>
                          <option value="hypertrophy">Hypertrophy (Size)</option>
                          <option value="powerbuilding">Powerbuilding</option>
                          <option value="endurance">Endurance</option>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="setup-equipment" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Equipment</Label>
                        <Select
                          id="setup-equipment"
                          value={equipment}
                          onChange={(e: any) => setEquipment(e.target.value)}
                          className="mt-1 text-xs font-bold"
                        >
                          <option value="full gym">Full Gym</option>
                          <option value="home gym">Home Gym</option>
                          <option value="bodyweight">Bodyweight Only</option>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="setup-experience" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Experience</Label>
                        <Select
                          id="setup-experience"
                          value={experience}
                          onChange={(e: any) => setExperience(e.target.value)}
                          className="mt-1 text-xs font-bold"
                        >
                          <option value="beginner">Beginner (&lt; 1 yr)</option>
                          <option value="intermediate">Intermediate (1-3 yrs)</option>
                          <option value="advanced">Advanced (3+ yrs)</option>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="setup-bodytype" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Body Type</Label>
                      <Select
                        id="setup-bodytype"
                        value={bodyType}
                        onChange={(e: any) => setBodyType(e.target.value)}
                        className="mt-1 text-xs font-bold"
                      >
                        <option value="mesomorph">Mesomorph (Athletic build)</option>
                        <option value="ectomorph">Ectomorph (Lean/faster metabolism)</option>
                        <option value="endomorph">Endomorph (Broad/easier mass)</option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* AI Configuration Section */}
                <div className="bg-card p-5 border border-card-border rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-3 select-none">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <Bot size={15} />
                        AI Coach Assistant
                      </h3>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                        Enable personalized AI feedback, automatic workout summaries, and plan generation right away.
                      </p>
                    </div>
                    <div className="flex items-center pt-1">
                      <button
                        type="button"
                        onClick={() => setSetupAiCoach(!setupAiCoach)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          setupAiCoach ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                            setupAiCoach ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {setupAiCoach && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2 border-t border-white/5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="setup-provider" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">AI Provider</Label>
                          <Select
                            id="setup-provider"
                            value={providerType}
                            onChange={(e: any) => setProviderType(e.target.value)}
                            className="mt-1 text-xs font-bold"
                          >
                            <option value="gemini">Google Gemini</option>
                            <option value="openai">OpenAI (GPT-4o)</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="grok">xAI Grok</option>
                            <option value="deepseek">DeepSeek API</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="ollama">Ollama (Local Offline)</option>
                            <option value="lmstudio">LM Studio (Local Offline)</option>
                            <option value="custom">Custom Compatible API</option>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="setup-apikey" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">API Key</Label>
                          <div className="relative mt-1">
                            <Input
                              id="setup-apikey"
                              type={showApiKey ? "text" : "password"}
                              maxLength={500}
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder={
                                providerType === "ollama" || providerType === "lmstudio"
                                  ? "Not required for local servers"
                                  : "Paste secret API key"
                              }
                              className="pr-10 text-xs font-mono font-bold"
                            />
                            {providerType !== "ollama" && providerType !== "lmstudio" && (
                              <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                              >
                                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Instructions for selected Provider */}
                      {(() => {
                        const instructions = getProviderInstructions(providerType);
                        if (!instructions) return null;
                        return (
                          <Surface className="p-3 bg-emerald-950/20 border border-emerald-500/10 text-zinc-300 rounded-xl space-y-2 select-text">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-450">
                                {instructions.title} Instructions
                              </span>
                            </div>
                            <ol className="list-decimal pl-4.5 text-[10px] text-zinc-400 space-y-1">
                              {instructions.steps.map((st, i) => (
                                <li key={i} className="leading-relaxed">{st}</li>
                              ))}
                            </ol>
                            {instructions.url && (
                              <a
                                href={instructions.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-[9px] font-bold text-emerald-450 hover:underline"
                              >
                                Go to Console Website →
                              </a>
                            )}
                          </Surface>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>

                {submitError && (
                  <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 text-rose-800 dark:text-rose-300 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                    <ShieldAlert size={16} className="mt-0.5 text-rose-750 dark:text-rose-400 shrink-0" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">Setup Failed</span>
                      <p className="text-[11px] leading-relaxed text-rose-950 dark:text-zinc-300">{submitError}</p>
                    </div>
                  </Surface>
                )}

                {/* Submit Actions */}
                <div className="flex gap-3 border-t border-card-border pt-4 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setView("menu");
                      setSubmitError(null);
                    }}
                    icon={<ArrowLeft size={16} />}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    className="ml-auto bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-450 dark:hover:bg-emerald-500 text-zinc-950 font-bold"
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    icon={isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Sparkles size={16} className="text-zinc-950" />
                    )}
                  >
                    {isSubmitting ? "Setting up..." : "Create Profile & Start"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </main>
  );
}