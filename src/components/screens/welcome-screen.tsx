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
  Flame,
  Check,
  Mail,
  Lock,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  AlertCircle,
  Cloud
} from "lucide-react";
import { useState, ChangeEvent, useEffect } from "react";
import { validateEmail } from "@/lib/email-validator";
import { restoreProfileByEmail } from "@/lib/sync";
import { renderGoogleSignInButton, type GoogleUser } from "@/lib/google-auth";
import { signInWithApple, isAppleSignInAvailable } from "@/lib/apple-auth";

type WelcomeView = "menu" | "backup" | "setup" | "restore" | "federated-setup";

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
  const importRawSnapshot = useAtlasStore((state) => state.importRawSnapshot);
  const finalizeRestore = useAtlasStore((state) => state.finalizeRestore);
  const theme = useAtlasStore((state) => state.theme);
  const setTheme = useAtlasStore((state) => state.setTheme);

  const [view, setView] = useState<WelcomeView>("menu");
  const [selectedSyncType, setSelectedSyncType] = useState<"federated" | "offline" | null>(null);

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

  // New Onboarding and Restore Email states
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showSandboxOtp, setShowSandboxOtp] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);
  const [isRestoringFromCloud, setIsRestoringFromCloud] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreEmpty, setRestoreEmpty] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [capturedProvider, setCapturedProvider] = useState<"apple" | "google" | "email" | null>(null);

  // ─── Google One Tap state ───
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [forceLoadRealGoogle, setForceLoadRealGoogle] = useState(false);
  const [sandboxEmail, setSandboxEmail] = useState("athlete.dev@gmail.com");

  // ─── Apple Sign In state ───
  const [appleAuthError, setAppleAuthError] = useState<string | null>(null);
  const [appleAuthLoading, setAppleAuthLoading] = useState(false);
  const appleAvailability = typeof window !== "undefined" ? isAppleSignInAvailable() : { available: false, reason: "Loading..." };

  /** Trigger real Apple Sign In popup */
  const handleAppleSignIn = (onSuccess: (email: string, name: string) => void) => {
    setAppleAuthError(null);
    setAppleAuthLoading(true);
    signInWithApple(
      (user) => {
        setAppleAuthLoading(false);
        onSuccess(user.email, user.name);
      },
      (err) => {
        setAppleAuthLoading(false);
        setAppleAuthError(err);
      }
    );
  };

  // Handle Apple redirect callback (when popup was blocked; Apple redirects back with query params)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const appleEmail = params.get("apple_email");
    const appleName = params.get("apple_name") ?? "";
    const appleError = params.get("apple_error");

    if (appleError) {
      setAppleAuthError(`Apple Sign In failed: ${appleError.replace(/_/g, " ")}`);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (appleEmail) {
      // Apple redirect callback — auto-continue sign-in
      setEmailInput(appleEmail);
      setEmailVerified(true);
      setCapturedProvider("apple");
      if (appleName) setName(appleName.split(" ")[0]);
      setView("setup");
      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cloud restore states
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMethod, setRestoreMethod] = useState<"google" | "email">("google");
  const [restoreEmailInput, setRestoreEmailInput] = useState("");
  const [restoreEmailError, setRestoreEmailError] = useState<string | null>(null);
  const [restoreEmailOtpSent, setRestoreEmailOtpSent] = useState(false);
  const [restoreEmailGeneratedOtp, setRestoreEmailGeneratedOtp] = useState("");
  const [restoreEmailOtpInput, setRestoreEmailOtpInput] = useState("");
  const [restoreEmailOtpError, setRestoreEmailOtpError] = useState<string | null>(null);
  const [isSendingRestoreEmailOtp, setIsSendingRestoreEmailOtp] = useState(false);
  const [showRestoreSandboxOtp, setShowRestoreSandboxOtp] = useState(false);

  // AI Setup states
  const [setupAiCoach, setSetupAiCoach] = useState(false);
  const [providerType, setProviderType] = useState<typeof providerTypes[number]>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setEmailError(null);
    setOtpError(null);
    const validation = validateEmail(emailInput);
    if (!validation.isValid) {
      setEmailError(validation.error || "Invalid email address.");
      return;
    }
    
    setIsSendingOtp(true);

    try {
      const checkRes = await restoreProfileByEmail(emailInput.toLowerCase().trim());
      if (checkRes.success && checkRes.snapshot) {
        const isGoogle = checkRes.snapshot.profile?.capturedProvider === "google";
        if (isGoogle) {
          setEmailError("This email is already associated with an account via Google Sign-In. Please return to the main screen and select 'Sign up with Google'.");
        } else {
          setEmailError("This email is already associated with an existing profile. To restore your data, please return to the main screen and select the Import/Restore Backup option.");
        }
        setIsSendingOtp(false);
        return;
      }
    } catch (e) {
      console.warn("Uniqueness check error:", e);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpCopied(false);

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          otp: code,
          userName: name || "User"
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOtpSent(true);
        setShowSandboxOtp(false);
      } else {
        setOtpSent(true);
        setShowSandboxOtp(true);
        console.warn("Falling back to simulated sandbox mailbox:", data.error);
      }
    } catch (e) {
      setOtpSent(true);
      setShowSandboxOtp(true);
      console.warn("Network error during API dispatch. Falling back to simulated sandbox mailbox.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = (onSuccess: () => void) => {
    setOtpError(null);
    if (otpInput.trim() === generatedOtp) {
      setShowSandboxOtp(false);
      onSuccess();
    } else {
      setOtpError("Incorrect 6-digit verification code. Please check your simulated sandbox mailbox and try again.");
    }
  };

  const handleGoogleAuthSuccess = async (email: string, displayName?: string, mode?: string) => {
    setGoogleAuthLoading(true);
    setGoogleAuthError(null);

    const cleanEmail = email.toLowerCase().trim();
    setEmailInput(cleanEmail);
    setCapturedProvider("google");

    const activeLocalProfile = useAtlasStore.getState().profile;
    if (activeLocalProfile && activeLocalProfile.email?.toLowerCase().trim() === cleanEmail) {
      console.log("[Google Sign-In] Matching profile already exists in IndexedDB. Loading immediately...");
      await finalizeRestore("local");
      setGoogleAuthLoading(false);
      return;
    }

    try {
      const res = await restoreProfileByEmail(cleanEmail);
      if (res.success && res.snapshot) {
        console.log("[Google Sign-In] Existing cloud profile found. Restoring...");
        if (res.snapshot.profile) {
          res.snapshot.profile.email = cleanEmail;
          res.snapshot.profile.emailVerified = true;
        }
        await importRawSnapshot(res.snapshot);
        console.log("[Google Sign-In] Auto-finalizing cloud restore...");
        await finalizeRestore("local");
      } else {
        console.log("[Google Sign-In] No profile found. Directing to onboarding biometrics setup...");
        if (displayName) setName(displayName.split(" ")[0]);
        setEmailVerified(true);
        setView("setup");
      }
    } catch (e: any) {
      console.warn("[Google Sign-In] Cloud check failed, falling back to manual onboarding setup:", e);
      if (displayName) setName(displayName.split(" ")[0]);
      setEmailVerified(true);
      setView("setup");
    } finally {
      setGoogleAuthLoading(false);
    }
  };

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



  const handleSendRestoreEmailOtp = async () => {
    setRestoreEmailError(null);
    setRestoreEmailOtpError(null);
    const validation = validateEmail(restoreEmailInput);
    if (!validation.isValid) {
      setRestoreEmailError(validation.error || "Invalid email address.");
      return;
    }

    setIsSendingRestoreEmailOtp(true);

    try {
      const checkRes = await restoreProfileByEmail(restoreEmailInput.toLowerCase().trim());
      if (!checkRes.success || !checkRes.snapshot) {
        setRestoreEmailError("No saved cloud profile was found for this email. If you want to create a new profile, please return to the welcome screen and select 'Sign up with Google' or use 'Local Setup'.");
        setIsSendingRestoreEmailOtp(false);
        return;
      }

      // Check if it's a Google Sign-In profile
      const isGoogle = checkRes.snapshot.profile?.capturedProvider === "google";
      if (isGoogle) {
        setRestoreEmailError("This profile is registered through Google Sign-In. Please return to the main menu and select 'Sign up with Google' to access your profile.");
        setIsSendingRestoreEmailOtp(false);
        return;
      }
    } catch (e) {
      console.warn("Uniqueness lookup failed during email restore setup:", e);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRestoreEmailGeneratedOtp(code);
    setRestoreEmailOtpSent(true);

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: restoreEmailInput,
          otp: code,
          userName: "Athlete"
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowRestoreSandboxOtp(false);
      } else {
        setShowRestoreSandboxOtp(true);
        console.warn("Falling back to simulated sandbox mailbox:", data.error);
      }
    } catch (e) {
      setShowRestoreSandboxOtp(true);
      console.warn("Network error during API dispatch. Falling back to simulated sandbox mailbox.");
    } finally {
      setIsSendingRestoreEmailOtp(false);
    }
  };

  const handleVerifyRestoreEmailOtp = async () => {
    setRestoreEmailOtpError(null);
    if (restoreEmailOtpInput.trim() !== restoreEmailGeneratedOtp) {
      setRestoreEmailOtpError("Incorrect 6-digit verification code. Please check your simulated sandbox mailbox and try again.");
      return;
    }

    setIsRestoring(true);
    try {
      const res = await restoreProfileByEmail(restoreEmailInput.toLowerCase().trim());
      if (res.success && res.snapshot) {
        if (res.snapshot.profile) {
          res.snapshot.profile.email = restoreEmailInput.toLowerCase().trim();
          res.snapshot.profile.emailVerified = true;
        }
        await importRawSnapshot(res.snapshot);
        console.log("[Email Restore] Syncing complete! Auto-finalizing...");
        await finalizeRestore("local");
      } else {
        setRestoreEmailOtpError("Failed to fetch cloud database snapshot.");
      }
    } catch (err: any) {
      setRestoreEmailOtpError(err.message || "Failed to load snapshot from Cloud sync storage.");
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

    if (capturedProvider === "email") {
      const emailValidation = validateEmail(emailInput);
      if (!emailValidation.isValid) {
        setSubmitError(emailValidation.error || "Please enter a valid email address.");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const cleanEmail = emailInput.toLowerCase().trim();
    if (cleanEmail) {
      try {
        const checkRes = await restoreProfileByEmail(cleanEmail);
        if (checkRes.success && checkRes.snapshot) {
          const isGoogle = checkRes.snapshot.profile?.capturedProvider === "google";
          if (isGoogle) {
            setSubmitError("This email is already associated with a profile via Google Sign-In. Please return to the welcome screen and select 'Sign up with Google'.");
          } else {
            setSubmitError("This email is already associated with an existing profile. Please return to the welcome screen and select the Import/Restore Backup option.");
          }
          setIsSubmitting(false);
          return;
        }
      } catch (e) {
        console.warn("Uniqueness check during setup submit failed:", e);
      }
    }

    if (capturedProvider === "email") {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpCopied(false);

      try {
        const response = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            otp: code,
            userName: name.trim() || "User"
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setOtpSent(true);
          setShowSandboxOtp(false);
        } else {
          setOtpSent(true);
          setShowSandboxOtp(true);
          console.warn("Falling back to simulated sandbox mailbox:", data.error);
        }
      } catch (e) {
        setOtpSent(true);
        setShowSandboxOtp(true);
        console.warn("Network error during API dispatch. Falling back to simulated sandbox mailbox.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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
        email: cleanEmail,
        emailVerified: cleanEmail !== "",
        capturedProvider: capturedProvider,
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
    <main className="flex min-h-dvh flex-col items-center justify-start sm:justify-center bg-background p-4 py-8 sm:py-12 overflow-y-auto text-foreground selection:bg-emerald-300 selection:text-zinc-950 relative">
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => void setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border bg-card/80 text-zinc-500 hover:text-foreground shadow-sm transition duration-200 cursor-pointer"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* NO sandbox OTP toast — removed for clean UX */}

      <Card className={`w-full transition-all duration-300 p-6 relative overflow-hidden shrink-0 ${view === "setup" ? "max-w-3xl" : "max-w-xl"}`}>
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        {/* App Logo & Header */}
        <div className="text-center mb-6 select-none">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-zinc-950 shadow-[0_8px_20px_rgba(16,185,129,0.2)] mb-3 keep-light">
            <Dumbbell size={26} className="text-zinc-955 keep-light" />
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
                {/* 1. Sign up with Google */}
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
                    setSelectedSyncType("federated");
                    setGoogleAuthError(null);
                    setView("federated-setup");
                  }}
                  className="flex items-start text-left p-5 rounded-2xl border border-emerald-500/15 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/40 transition-all duration-200 group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-12 -bottom-12 h-24 w-24 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-xl pointer-events-none group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 transition-all" />
                  
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mr-4 shadow-sm border border-emerald-500/20">
                    <Cloud size={20} className="stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      Sign up with Google
                      <ArrowRight size={14} className="text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Sync to any device. Logs you in automatically if an account exists, or starts a fresh personalized setup.
                    </p>
                  </div>
                </button>

                {/* 2. Local Setup (Continue with Email) */}
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
                    setSelectedSyncType("offline");
                    setEmailInput("");
                    setEmailVerified(true); // skip separate entry screen, go straight to setup
                    setOtpSent(false);
                    setOtpInput("");
                    setOtpError(null);
                    setEmailError(null);
                    setCapturedProvider("email");
                    setView("setup");
                  }}
                  className="flex items-start text-left p-5 rounded-2xl border border-blue-500/15 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5 hover:bg-blue-50/80 dark:hover:bg-blue-500/10 hover:border-blue-500/30 dark:hover:border-blue-500/40 transition-all duration-200 group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-12 -bottom-12 h-24 w-24 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-xl pointer-events-none group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-all" />
                  
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mr-4 shadow-sm border border-blue-500/20">
                    <Mail size={20} className="stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                      Local Setup
                      <ArrowRight size={14} className="text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Create your training profile manually. Verifies your email with a 6-digit code to enable secure cloud sync and automatic backups.
                    </p>
                  </div>
                </button>

                {/* 3. Restore Profile */}
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput("");
                    setEmailError(null);
                    setOtpInput("");
                    setOtpError(null);
                    setOtpSent(false);
                    setRestoreSuccess(false);
                    setRestoreEmpty(false);
                    setRestoreError(null);
                    setCapturedProvider(null);
                    setGoogleAuthError(null);
                    setRestoreMethod("google");
                    setView("backup");
                  }}
                  className="flex items-start text-left p-5 rounded-2xl border border-teal-500/15 dark:border-teal-500/20 bg-teal-50/40 dark:bg-teal-500/5 hover:bg-teal-50/80 dark:hover:bg-teal-500/10 hover:border-teal-500/30 dark:hover:border-teal-500/40 transition-all duration-200 group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-12 -bottom-12 h-24 w-24 rounded-full bg-teal-500/5 dark:bg-teal-500/10 blur-xl pointer-events-none group-hover:bg-teal-500/10 dark:group-hover:bg-teal-500/20 transition-all" />
                  
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mr-4 shadow-sm border border-teal-500/20">
                    <RefreshCw size={20} className="stroke-[2.5]" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                      Restore Profile
                      <ArrowRight size={14} className="text-zinc-500 group-hover:text-teal-600 dark:group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Restore workouts, routines, and settings from a cloud backup using Google Drive or Cloud Email Sync.
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {view === "federated-setup" && (
            <motion.div
              key="federated-setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-5 text-left"
            >
              <div className="space-y-1.5 border-b border-card-border pb-3">
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Cloud className="text-emerald-500 dark:text-emerald-400" size={20} />
                  Sign in with Google
                </h2>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Access your profile or sync a new device. Existing profiles are loaded automatically; new users proceed to a quick biometrics setup.
                </p>
              </div>

              {googleAuthError && (
                <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 rounded-xl flex items-start gap-2">
                  <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-rose-700 dark:text-zinc-300 leading-relaxed">{googleAuthError}</p>
                </Surface>
              )}

              {googleAuthLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  <p className="text-xs text-zinc-500 font-medium">Checking sync status...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Real Google Sign-In button rendered by GIS SDK */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-555 font-mono">Google Authentication</p>
                    
                    {typeof window !== "undefined" && 
                     (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && 
                     !forceLoadRealGoogle ? (
                      // Beautiful Local Sandbox Card
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Local Developer Sandbox Mode</p>
                            <p className="text-[10px] text-zinc-555 dark:text-zinc-400 leading-relaxed">
                              Google Sign-In requires your current origin (<code>{window.location.origin}</code>) to be registered under <strong>Authorized JavaScript Origins</strong> in the Google Developer Console.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sandbox Test Email</Label>
                          <Input
                            type="email"
                            value={sandboxEmail}
                            onChange={(e) => setSandboxEmail(e.target.value)}
                            placeholder="e.g. athlete.dev@gmail.com or your real email"
                            className="bg-zinc-950/40 border-zinc-500/20 focus:ring-1 focus:ring-amber-500/30 text-xs font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          <button
                            type="button"
                            onClick={async () => {
                              const cleanEmail = sandboxEmail.toLowerCase().trim() || "athlete.dev@gmail.com";
                              await handleGoogleAuthSuccess(cleanEmail, "Dev Athlete", "signup");
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition duration-200 cursor-pointer text-center select-none active:scale-[0.99]"
                          >
                            Simulate Google Sign-In (Sandbox Bypass)
                          </button>

                          <button
                            type="button"
                            onClick={() => setForceLoadRealGoogle(true)}
                            className="w-full text-center py-1.5 text-[9px] font-semibold text-zinc-555 hover:text-zinc-700 dark:hover:text-zinc-300 transition duration-150 cursor-pointer select-none underline decoration-dotted"
                          >
                            Load official Google Sign-In SDK (to test credentials)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        id="google-signin-new-account"
                        ref={(el) => {
                          if (el) {
                            renderGoogleSignInButton(
                              "google-signin-new-account",
                              async (user) => {
                                await handleGoogleAuthSuccess(user.email, user.name, "signup");
                              },
                              (err) => setGoogleAuthError(err)
                            );
                          }
                        }}
                        className="min-h-[44px] w-full"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-zinc-500/10 dark:border-white/5 bg-zinc-500/5 p-3.5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">⚠️ Important</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Your profile and data will sync securely using this email. Use the same sign-in method on all other devices.
                </p>
              </div>

              <div className="flex border-t border-card-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setView("menu")}
                  icon={<ArrowLeft size={16} />}
                >
                  Back
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
              className="space-y-4 text-left"
            >
              <div className="space-y-1.5 border-b border-card-border pb-3 mb-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <FileUp className="text-blue-400" size={20} />
                  Restore training profile
                </h2>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Restore your routines, workouts, and settings using Google Drive or your Cloud Email Sync account.
                </p>
              </div>

              {/* Restore Method Selection Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950/40 border border-zinc-500/10 dark:border-white/5 rounded-xl mb-4 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setRestoreMethod("google");
                    setGoogleAuthError(null);
                  }}
                  className={`py-2 text-[11px] font-bold rounded-lg transition duration-200 cursor-pointer ${
                    restoreMethod === "google"
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-150 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                  }`}
                >
                  Google Drive Backup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRestoreMethod("email");
                    setRestoreEmailError(null);
                    setRestoreEmailOtpError(null);
                  }}
                  className={`py-2 text-[11px] font-bold rounded-lg transition duration-200 cursor-pointer ${
                    restoreMethod === "email"
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-150 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                  }`}
                >
                  Cloud Email Sync
                </button>
              </div>

              {restoreMethod === "google" ? (
                <div className="space-y-4 pt-1 animate-fadeIn">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal mb-2">
                    Sign in with Google to retrieve your profile and training logs automatically from your secure Google Drive.
                  </p>

                  {googleAuthError && (
                    <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 rounded-xl flex items-start gap-2">
                      <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-rose-700 dark:text-zinc-300 leading-relaxed">{googleAuthError}</p>
                    </Surface>
                  )}

                  {googleAuthLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                      <p className="text-xs text-zinc-500 font-medium">Checking sync status...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Google Sign-in options */}
                      {typeof window !== "undefined" && 
                       (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && 
                       !forceLoadRealGoogle ? (
                        // Sandbox card
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Local Developer Sandbox Mode</p>
                              <p className="text-[10px] text-zinc-555 dark:text-zinc-400 leading-relaxed">
                                Google Sign-In requires your current origin (<code>{window.location.origin}</code>) to be registered under <strong>Authorized JavaScript Origins</strong> in the Google Developer Console.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sandbox Test Email</Label>
                            <Input
                              type="email"
                              value={sandboxEmail}
                              onChange={(e) => setSandboxEmail(e.target.value)}
                              placeholder="e.g. athlete.dev@gmail.com or your real email"
                              className="bg-zinc-950/40 border-zinc-500/20 focus:ring-1 focus:ring-amber-500/30 text-xs font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            <button
                              type="button"
                              onClick={async () => {
                                const cleanEmail = sandboxEmail.toLowerCase().trim() || "athlete.dev@gmail.com";
                                await handleGoogleAuthSuccess(cleanEmail, "Dev Athlete", "signup");
                              }}
                              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition duration-200 cursor-pointer text-center select-none active:scale-[0.99]"
                            >
                              Simulate Google Sign-In (Sandbox Bypass)
                            </button>

                            <button
                              type="button"
                              onClick={() => setForceLoadRealGoogle(true)}
                              className="w-full text-center py-1.5 text-[9px] font-semibold text-zinc-555 hover:text-zinc-700 dark:hover:text-zinc-300 transition duration-150 cursor-pointer select-none underline decoration-dotted"
                            >
                              Load official Google Sign-In SDK (to test credentials)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          id="google-signin-restore-account"
                          ref={(el) => {
                            if (el) {
                              renderGoogleSignInButton(
                                "google-signin-restore-account",
                                async (user) => {
                                  await handleGoogleAuthSuccess(user.email, user.name, "signup");
                                },
                                (err) => setGoogleAuthError(err)
                              );
                            }
                          }}
                          className="min-h-[44px] w-full"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 border-t border-card-border pt-4 mt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setView("menu");
                        setGoogleAuthError(null);
                      }}
                      icon={<ArrowLeft size={16} />}
                      disabled={googleAuthLoading}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1 animate-fadeIn">
                  {!restoreEmailOtpSent ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="restore-email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</Label>
                        <div className="relative">
                          <Input
                            id="restore-email"
                            type="email"
                            value={restoreEmailInput}
                            onChange={(e) => {
                              setRestoreEmailInput(e.target.value);
                              setRestoreEmailError(null);
                            }}
                            placeholder="e.g. your-profile-email@domain.com"
                            className="pl-9 text-xs font-medium focus:ring-2 focus:ring-blue-400/10"
                            disabled={isSendingRestoreEmailOtp}
                          />
                          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-505" />
                        </div>
                      </div>

                      {restoreEmailError && (
                        <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 text-rose-800 dark:text-rose-300 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                          <ShieldAlert size={14} className="mt-0.5 text-rose-750 dark:text-rose-450 shrink-0" />
                          <p className="text-[10px] sm:text-[11px] leading-relaxed text-rose-955 dark:text-zinc-300">{restoreEmailError}</p>
                        </Surface>
                      )}

                      <div className="flex gap-3 border-t border-card-border pt-4 mt-6">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setView("menu")}
                          icon={<ArrowLeft size={16} />}
                          disabled={isSendingRestoreEmailOtp}
                        >
                          Back
                        </Button>
                        <Button
                          className="ml-auto bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-450 dark:hover:bg-emerald-500 text-zinc-950 font-bold"
                          variant="primary"
                          onClick={handleSendRestoreEmailOtp}
                          icon={isSendingRestoreEmailOtp ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                          ) : (
                            <Mail size={16} className="text-zinc-955" />
                          )}
                          disabled={isSendingRestoreEmailOtp || !restoreEmailInput.trim()}
                        >
                          {isSendingRestoreEmailOtp ? "Searching & Sending..." : "Send Verification Code"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 flex items-start gap-2.5">
                        <Lock className="text-emerald-500 shrink-0 mt-0.5 animate-pulse" size={15} />
                        <div className="space-y-0.5 text-left">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Verification Sent</span>
                          <p className="text-[10px] text-zinc-400 leading-normal">
                            We sent a 6-digit verification code to <strong className="text-zinc-900 dark:text-zinc-200">{restoreEmailInput}</strong>.
                          </p>
                        </div>
                      </div>

                      {showRestoreSandboxOtp && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-fadeIn">
                          <Lock size={14} className="text-emerald-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Sandbox Verification Code</p>
                            <p className="text-[11px] font-mono text-foreground font-bold tracking-widest">{restoreEmailGeneratedOtp}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(restoreEmailGeneratedOtp);
                            }}
                            className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition"
                          >
                            Copy
                          </button>
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label htmlFor="restore-otp" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">6-Digit Code</Label>
                        <Input
                          id="restore-otp"
                          type="text"
                          maxLength={6}
                          value={restoreEmailOtpInput}
                          onChange={(e) => {
                            setRestoreEmailOtpInput(e.target.value.replace(/[^0-9]/g, ""));
                            setRestoreEmailOtpError(null);
                          }}
                          placeholder="e.g. 123456"
                          className="text-xs font-mono font-black text-center tracking-widest focus:ring-2 focus:ring-blue-400/10"
                          disabled={isRestoring}
                        />
                      </div>

                      {restoreEmailOtpError && (
                        <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 text-rose-800 dark:text-rose-300 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                          <ShieldAlert size={14} className="mt-0.5 text-rose-750 dark:text-rose-450 shrink-0" />
                          <p className="text-[10px] sm:text-[11px] leading-relaxed text-rose-955 dark:text-zinc-300">{restoreEmailOtpError}</p>
                        </Surface>
                      )}

                      <div className="flex gap-3 border-t border-card-border pt-4 mt-6">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setRestoreEmailOtpSent(false);
                            setRestoreEmailOtpInput("");
                            setRestoreEmailOtpError(null);
                            setShowRestoreSandboxOtp(false);
                          }}
                          icon={<ArrowLeft size={16} />}
                          disabled={isRestoring}
                        >
                          Change Email
                        </Button>
                        <Button
                          className="ml-auto bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-450 dark:hover:bg-emerald-500 text-zinc-950 font-bold"
                          variant="primary"
                          onClick={handleVerifyRestoreEmailOtp}
                          icon={isRestoring ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                          ) : (
                            <Check size={16} className="text-zinc-955 font-bold animate-pulse" />
                          )}
                          disabled={isRestoring || restoreEmailOtpInput.length !== 6}
                        >
                          {isRestoring ? "Restoring Profile..." : "Verify & Restore"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {view === "restore" && (
            <motion.div
              key="restore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4 text-left"
            >
              <div className="space-y-1.5 border-b border-card-border pb-3 mb-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <RefreshCw className="text-teal-500 dark:text-teal-400" size={20} />
                  Sign in to restore your account
                </h2>
                <p className="text-[11px] text-zinc-400 leading-normal font-medium">
                  Sign in with the same Google account you used when you first set up Atlas. Your profile will be restored automatically.
                </p>
              </div>

              {restoreSuccess ? (
                <div className="space-y-4 py-4 text-center animate-fadeIn select-none">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3 shadow-[0_4px_12px_rgba(16,185,129,0.1)] animate-bounce">
                    <Check size={22} className="stroke-[3.5]" />
                  </div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">Profile Restored!</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
                    Welcome back! Your workouts, routines, and settings have been restored to this device.
                  </p>
                  <Button
                    className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-450 dark:hover:bg-emerald-500 text-zinc-955 font-bold"
                    variant="primary"
                    onClick={async () => {
                      await finalizeRestore("local");
                    }}
                    icon={<Sparkles size={16} className="text-zinc-955" />}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : isRestoringFromCloud ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                  <p className="text-xs text-zinc-500 font-medium">Looking up your profile...</p>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {restoreEmpty && (
                    <Surface className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/15 text-amber-800 dark:text-amber-300 rounded-xl space-y-2">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert size={16} className="mt-0.5 text-amber-700 dark:text-amber-450 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">No profile found</span>
                          <p className="text-[11px] leading-relaxed text-zinc-650 dark:text-zinc-300">
                            No saved profile was found for this account. Check that you're using the same Google account you signed up with, or create a new account.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 pt-1 pl-6">
                        <button
                          type="button"
                          onClick={() => {
                            setName(""); setAge(28); setWeight(165); setHeight(70);
                            setExperience("beginner"); setBodyType("mesomorph");
                            setTargetPhysique("athletic"); setGoal("Build strength and muscle size");
                            setDaysPerWeek(3); setWeightUnit("lbs"); setHeightUnit("in");
                            setSetupAiCoach(true); setEmailVerified(true);
                            setView("setup");
                          }}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase transition"
                        >
                          Create New Profile
                        </button>
                      </div>
                    </Surface>
                  )}

                  {restoreError && (
                    <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 text-rose-800 dark:text-rose-300 rounded-xl flex items-start gap-2.5">
                      <ShieldAlert size={14} className="mt-0.5 text-rose-750 dark:text-rose-450 shrink-0" />
                      <p className="text-[10px] sm:text-[11px] leading-relaxed text-rose-955 dark:text-zinc-300">{restoreError}</p>
                    </Surface>
                  )}

                  {googleAuthError && (
                    <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 rounded-xl flex items-start gap-2">
                      <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-rose-700 dark:text-zinc-300">{googleAuthError}</p>
                    </Surface>
                  )}

                  <div className="space-y-3">
                    {/* Real Google Sign-In button for restore */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sign in with Google to restore</p>
                      
                      {typeof window !== "undefined" && 
                       (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && 
                       !forceLoadRealGoogle ? (
                        // Beautiful Local Sandbox Card
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Local Developer Sandbox Mode</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Google Sign-In requires your current origin (<code>{window.location.origin}</code>) to be registered under <strong>Authorized JavaScript Origins</strong> in the Google Developer Console.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sandbox Test Email</Label>
                            <Input
                              type="email"
                              value={sandboxEmail}
                              onChange={(e) => setSandboxEmail(e.target.value)}
                              placeholder="e.g. athlete.dev@gmail.com or your real email"
                              className="bg-zinc-950/40 border-zinc-500/20 focus:ring-1 focus:ring-amber-500/30 text-xs font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            <button
                              type="button"
                              onClick={async () => {
                                const cleanEmail = sandboxEmail.toLowerCase().trim() || "athlete.dev@gmail.com";
                                await handleGoogleAuthSuccess(cleanEmail, undefined, "signin");
                              }}
                              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition duration-200 cursor-pointer text-center select-none active:scale-[0.99]"
                            >
                              Simulate Google Sign-In (Sandbox Bypass)
                            </button>

                            <button
                              type="button"
                              onClick={() => setForceLoadRealGoogle(true)}
                              className="w-full text-center py-1.5 text-[9px] font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition duration-150 cursor-pointer select-none underline decoration-dotted"
                            >
                              Load official Google Sign-In SDK (to test credentials)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          id="google-signin-restore"
                          ref={(el) => {
                            if (el) {
                              renderGoogleSignInButton(
                                "google-signin-restore",
                                async (user) => {
                                  await handleGoogleAuthSuccess(user.email, user.name, "signin");
                                },
                                (err) => setGoogleAuthError(err)
                              );
                            }
                          }}
                          className="min-h-[44px] w-full"
                        />
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-card-border mt-4 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setView("menu")}
                      icon={<ArrowLeft size={16} />}
                      disabled={isRestoringFromCloud}
                    >
                      Back
                    </Button>
                    <button
                      type="button"
                      onClick={() => setView("backup")}
                      className="text-xs font-bold text-zinc-500 hover:text-foreground hover:underline transition"
                    >
                      Or check other restore options
                    </button>
                  </div>
                </div>
              )}
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
              {otpSent ? (
                // --- OTP Verification Panel for manual email flow ---
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-1.5 border-b border-card-border pb-3 mb-2">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Lock className="text-emerald-500 dark:text-emerald-400 animate-pulse" size={20} />
                      Verify Your Email Address
                    </h2>
                    <p className="text-[11px] text-zinc-400 leading-normal font-medium">
                      We sent a 6-digit verification code to <strong className="text-zinc-900 dark:text-zinc-200">{emailInput.toLowerCase().trim()}</strong>. Enter it below to complete your profile setup.
                    </p>
                  </div>

                  <div className="space-y-4 bg-card p-5 border border-card-border rounded-2xl shadow-sm">
                    {showSandboxOtp && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-fadeIn">
                        <Lock size={14} className="text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Verification code (dev mode)</p>
                          <p className="text-[11px] font-mono text-foreground font-bold tracking-widest">{generatedOtp}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedOtp);
                            setOtpCopied(true);
                            setTimeout(() => setOtpCopied(false), 2000);
                          }}
                          className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition"
                        >
                          {otpCopied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="setup-otp-input" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">6-Digit Verification Code</Label>
                      <Input
                        id="setup-otp-input"
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => {
                          setOtpInput(e.target.value.replace(/[^0-9]/g, ""));
                          setOtpError(null);
                        }}
                        placeholder="e.g. 123456"
                        className="text-xs font-mono font-black text-center tracking-widest focus:ring-emerald-500/20"
                        disabled={isSubmitting}
                      />
                      {otpError && (
                        <Surface className="p-3 mt-2 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 text-rose-800 dark:text-rose-300 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                          <ShieldAlert size={14} className="mt-0.5 text-rose-750 dark:text-rose-450 shrink-0" />
                          <p className="text-[10px] sm:text-[11px] leading-relaxed text-rose-955 dark:text-zinc-300">{otpError}</p>
                        </Surface>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-card-border pt-4 mt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpInput("");
                        setOtpError(null);
                        setShowSandboxOtp(false);
                      }}
                      icon={<ArrowLeft size={16} />}
                      disabled={isSubmitting}
                    >
                      Back to Edit Form
                    </Button>
                    <Button
                      className="ml-auto bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-450 dark:hover:bg-emerald-500 text-zinc-950 font-bold"
                      variant="primary"
                      onClick={async () => {
                        setOtpError(null);
                        if (otpInput.trim() === generatedOtp) {
                          setShowSandboxOtp(false);
                          setIsSubmitting(true);
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
                              email: emailInput.toLowerCase().trim(),
                              emailVerified: true,
                              capturedProvider: "email",
                            });
                            setStartupChoice("local");
                          } catch (e: any) {
                            console.error("Onboarding setup failed:", e);
                            setOtpError(e.message || "Failed to finalize profile. Please check API key or server configuration.");
                          } finally {
                            setIsSubmitting(false);
                          }
                        } else {
                          setOtpError("Incorrect 6-digit verification code. Please check your simulated sandbox mailbox and try again.");
                        }
                      }}
                      disabled={isSubmitting || otpInput.length !== 6}
                      icon={isSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                      ) : (
                        <Check size={16} className="text-zinc-955 font-bold" />
                      )}
                    >
                      {isSubmitting ? "Finalizing Profile..." : "Verify & Start Atlas"}
                    </Button>
                  </div>
                </div>
              ) : (
                // --- Setup Form View ---
                <>
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

                        {capturedProvider === "email" && (
                          <div>
                            <Label htmlFor="setup-email-input" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email Address</Label>
                            <div className="relative mt-1">
                              <Input
                                id="setup-email-input"
                                type="email"
                                value={emailInput}
                                onChange={(e) => {
                                  setEmailInput(e.target.value);
                                  setSubmitError(null);
                                }}
                                placeholder="e.g. alex@example.com"
                                className="text-xs font-medium pl-9 focus:ring-emerald-500/20"
                              />
                              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            </div>
                          </div>
                        )}

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
                    <div className="bg-card p-5 border border-card-border rounded-2xl shadow-sm space-y-4 mt-5">
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
                      <Surface className="p-3 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/15 text-rose-800 dark:text-rose-300 rounded-xl flex items-start gap-2.5 animate-fadeIn mt-4">
                        <ShieldAlert size={16} className="mt-0.5 text-rose-750 dark:text-rose-450 shrink-0" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">Setup Failed</span>
                          <p className="text-[11px] leading-relaxed text-rose-955 dark:text-zinc-300">{submitError}</p>
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
                          <Sparkles size={16} className="text-zinc-955 font-bold" />
                        )}
                      >
                        {isSubmitting ? "Setting up..." : "Create Profile & Start"}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </main>
  );
}