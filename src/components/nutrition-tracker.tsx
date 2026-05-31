"use client";

import { useState, useMemo, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Beef,
  Droplets,
  Wheat,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Apple,
  Coffee,
  UtensilsCrossed,
  Moon,
  Search,
  X,
  Check,
  Info,
  TrendingUp,
  Zap,
  Shield,
  Leaf,
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkles,
  Camera,
  Barcode,
} from "lucide-react";
import { Card, Surface } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useAtlasStore } from "@/store/useAtlasStore";
import { calculateNutritionTargets, DEFAULT_TARGETS } from "@/lib/calculators";
import { decryptString } from "@/lib/security/crypto";
import { getProviderAdapter } from "@/providers";

// ─── Types ──────────────────────────────────────────────────────
interface NutritionEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;   // g
  carbs: number;     // g
  fat: number;       // g
  fiber: number;     // g
  sugar: number;     // g
  sodium: number;    // mg
  potassium: number; // mg
  vitaminC: number;  // mg
  calcium: number;   // mg
  iron: number;      // mg
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  servingSize: number;
  servingUnit: string;
  timestamp: string;
}

interface WaterLogEntry {
  id: string;
  amount: number;    // ml
  timestamp: string;
}

// Common foods database for quick-add
interface CommonFoodItem {
  code?: string;
  name: string;
  brand?: string;
  aliases?: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  potassium: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  servingUnit: string;
  servingWeight?: number;
}

const COMMON_FOODS: CommonFoodItem[] = [
  // ─── PROTEINS ──────────────────────────────────────────────────
  { name: "Chicken Breast (cooked)", aliases: ["chicken", "chicken breast", "poultry"], calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, potassium: 256, vitaminC: 0, calcium: 15, iron: 1.0, servingUnit: "100g" },
  { name: "Turkey Breast (cooked)", aliases: ["turkey", "turkey breast"], calories: 135, protein: 30, carbs: 0, fat: 1.1, fiber: 0, sugar: 0, sodium: 68, potassium: 290, vitaminC: 0, calcium: 18, iron: 1.1, servingUnit: "100g" },
  { name: "Lean Ground Beef (93/7)", aliases: ["beef", "ground beef", "minced beef"], calories: 172, protein: 26, carbs: 0, fat: 7.6, fiber: 0, sugar: 0, sodium: 66, potassium: 318, vitaminC: 0, calcium: 12, iron: 2.7, servingUnit: "100g" },
  { name: "Sirloin Steak (grilled)", aliases: ["steak", "beef steak", "sirloin"], calories: 200, protein: 30, carbs: 0, fat: 8.0, fiber: 0, sugar: 0, sodium: 58, potassium: 360, vitaminC: 0, calcium: 24, iron: 2.4, servingUnit: "100g" },
  { name: "Salmon (grilled)", aliases: ["salmon", "fish", "fatty fish"], calories: 208, protein: 29, carbs: 0, fat: 9.0, fiber: 0, sugar: 0, sodium: 59, potassium: 628, vitaminC: 0, calcium: 13, iron: 0.9, servingUnit: "100g" },
  { name: "Tuna (canned in water)", aliases: ["tuna", "canned tuna", "tuna fish"], calories: 109, protein: 25, carbs: 0, fat: 0.5, fiber: 0, sugar: 0, sodium: 287, potassium: 267, vitaminC: 0, calcium: 11, iron: 1.3, servingUnit: "100g" },
  { name: "Cod Fillet (baked)", aliases: ["cod", "white fish", "fish fillet"], calories: 82, protein: 18, carbs: 0, fat: 0.7, fiber: 0, sugar: 0, sodium: 54, potassium: 413, vitaminC: 1.0, calcium: 16, iron: 0.4, servingUnit: "100g" },
  { name: "Whole Egg", aliases: ["egg", "eggs", "boiled egg", "fried egg"], calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0, sugar: 0.2, sodium: 71, potassium: 69, vitaminC: 0, calcium: 28, iron: 0.9, servingUnit: "1 large" },
  { name: "Egg Whites", aliases: ["egg white", "whites", "liquid egg whites"], calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, fiber: 0, sugar: 0.2, sodium: 55, potassium: 54, vitaminC: 0, calcium: 2.0, iron: 0, servingUnit: "1 large" },
  { name: "Tofu (firm)", aliases: ["tofu", "soy protein", "bean curd"], calories: 144, protein: 17, carbs: 3.0, fat: 8.0, fiber: 2.0, sugar: 0.5, sodium: 12, potassium: 240, vitaminC: 0, calcium: 683, iron: 2.7, servingUnit: "150g" },
  { name: "Tempeh", aliases: ["tempeh", "soy"], calories: 193, protein: 19, carbs: 9.0, fat: 11, fiber: 8.0, sugar: 1.0, sodium: 9, potassium: 412, vitaminC: 0, calcium: 111, iron: 2.7, servingUnit: "100g" },

  // ─── CARBS & GRAINS ─────────────────────────────────────────────
  { name: "Brown Rice (cooked)", aliases: ["rice", "brown rice", "cooked rice"], calories: 216, protein: 5.0, carbs: 45, fat: 1.8, fiber: 3.5, sugar: 0.7, sodium: 10, potassium: 154, vitaminC: 0, calcium: 20, iron: 1.0, servingUnit: "1 cup" },
  { name: "White Rice (cooked)", aliases: ["white rice", "jasmine rice", "basmati rice"], calories: 205, protein: 4.2, carbs: 44, fat: 0.4, fiber: 0.6, sugar: 0.1, sodium: 5, potassium: 55, vitaminC: 0, calcium: 16, iron: 1.9, servingUnit: "1 cup" },
  { name: "Oats (dry)", aliases: ["oats", "oatmeal", "porridge", "rolled oats"], calories: 150, protein: 5.0, carbs: 27, fat: 3.0, fiber: 4.0, sugar: 1.0, sodium: 0, potassium: 164, vitaminC: 0, calcium: 21, iron: 2.1, servingUnit: "40g" },
  { name: "Quinoa (cooked)", aliases: ["quinoa", "grain"], calories: 222, protein: 8.1, carbs: 39, fat: 3.6, fiber: 5.2, sugar: 1.5, sodium: 13, potassium: 318, vitaminC: 0, calcium: 31, iron: 2.8, servingUnit: "1 cup" },
  { name: "Sweet Potato (baked)", aliases: ["sweet potato", "yam", "baked sweet potato"], calories: 103, protein: 2.3, carbs: 24, fat: 0.1, fiber: 3.8, sugar: 7.4, sodium: 41, potassium: 542, vitaminC: 23, calcium: 39, iron: 0.8, servingUnit: "1 medium" },
  { name: "Baked Potato", aliases: ["potato", "white potato", "russet potato"], calories: 168, protein: 4.3, carbs: 38, fat: 0.2, fiber: 4.0, sugar: 1.5, sodium: 12, potassium: 926, vitaminC: 16, calcium: 28, iron: 1.9, servingUnit: "1 medium" },
  { name: "Whole Wheat Bread", aliases: ["bread", "toast", "whole wheat", "wheat bread"], calories: 80, protein: 4.0, carbs: 14, fat: 1.0, fiber: 2.0, sugar: 1.5, sodium: 130, potassium: 75, vitaminC: 0, calcium: 30, iron: 0.8, servingUnit: "1 slice" },
  { name: "White Bread", aliases: ["white bread", "toast white"], calories: 75, protein: 2.0, carbs: 14, fat: 0.8, fiber: 0.6, sugar: 1.4, sodium: 140, potassium: 25, vitaminC: 0, calcium: 40, iron: 0.9, servingUnit: "1 slice" },
  { name: "Pasta (cooked)", aliases: ["pasta", "spaghetti", "noodles"], calories: 220, protein: 8.0, carbs: 43, fat: 1.3, fiber: 2.5, sugar: 0.8, sodium: 2, potassium: 86, vitaminC: 0, calcium: 12, iron: 1.6, servingUnit: "1 cup" },
  { name: "Bagel (plain)", aliases: ["bagel", "bread bagel"], calories: 245, protein: 10, carbs: 48, fat: 1.5, fiber: 2.2, sugar: 6.0, sodium: 430, potassium: 90, vitaminC: 0, calcium: 25, iron: 3.2, servingUnit: "1 plain" },
  { name: "Tortilla (flour)", aliases: ["tortilla", "flour tortilla", "wrap"], calories: 140, protein: 4.0, carbs: 22, fat: 3.5, fiber: 1.0, sugar: 0.5, sodium: 360, potassium: 45, vitaminC: 0, calcium: 60, iron: 1.4, servingUnit: "1 medium" },
  { name: "Rice Cake (plain)", aliases: ["rice cake", "rice cakes"], calories: 35, protein: 0.7, carbs: 7.3, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 20, potassium: 25, vitaminC: 0, calcium: 1.0, iron: 0.1, servingUnit: "1 cake" },

  // ─── DAIRY & FATS ───────────────────────────────────────────────
  { name: "Greek Yogurt (0% fat)", aliases: ["yogurt", "greek yogurt", "nonfat yogurt"], calories: 100, protein: 17, carbs: 6.0, fat: 0.7, fiber: 0, sugar: 6.0, sodium: 55, potassium: 240, vitaminC: 0, calcium: 200, iron: 0.1, servingUnit: "170g" },
  { name: "Cottage Cheese (2%)", aliases: ["cottage cheese", "curds"], calories: 206, protein: 28, carbs: 8.0, fat: 4.4, fiber: 0, sugar: 6.0, sodium: 746, potassium: 297, vitaminC: 0, calcium: 187, iron: 0.4, servingUnit: "1 cup" },
  { name: "Cheddar Cheese", aliases: ["cheese", "cheddar", "sliced cheese"], calories: 115, protein: 7.0, carbs: 0.4, fat: 9.4, fiber: 0, sugar: 0.1, sodium: 180, potassium: 28, vitaminC: 0, calcium: 200, iron: 0.1, servingUnit: "28g" },
  { name: "Peanut Butter", aliases: ["pb", "peanut butter", "nut butter"], calories: 188, protein: 8.0, carbs: 6.0, fat: 16, fiber: 1.9, sugar: 3.0, sodium: 152, potassium: 189, vitaminC: 0, calcium: 14, iron: 0.6, servingUnit: "2 tbsp" },
  { name: "Almonds", aliases: ["almonds", "nuts", "almond"], calories: 164, protein: 6.0, carbs: 6.0, fat: 14, fiber: 3.5, sugar: 1.2, sodium: 0, potassium: 208, vitaminC: 0, calcium: 75, iron: 1.1, servingUnit: "28g" },
  { name: "Olive Oil", aliases: ["oil", "olive oil", "cooking oil"], calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0, sugar: 0, sodium: 0, potassium: 0, vitaminC: 0, calcium: 0, iron: 0, servingUnit: "1 tbsp" },
  { name: "Avocado", aliases: ["avocado", "guacamole"], calories: 240, protein: 3.0, carbs: 13, fat: 22, fiber: 10, sugar: 0.4, sodium: 11, potassium: 975, vitaminC: 15, calcium: 18, iron: 0.8, servingUnit: "1 medium" },
  { name: "Whole Milk", aliases: ["milk", "whole milk", "dairy milk"], calories: 149, protein: 8.0, carbs: 12, fat: 8.0, fiber: 0, sugar: 12, sodium: 105, potassium: 322, vitaminC: 0, calcium: 276, iron: 0.1, servingUnit: "240ml" },
  { name: "Almond Milk (unsweetened)", aliases: ["almond milk", "nut milk"], calories: 30, protein: 1.0, carbs: 1.0, fat: 2.5, fiber: 0.5, sugar: 0, sodium: 160, potassium: 170, vitaminC: 0, calcium: 450, iron: 0.7, servingUnit: "240ml" },
  { name: "Butter", aliases: ["butter", "spread"], calories: 102, protein: 0.1, carbs: 0, fat: 11.5, fiber: 0, sugar: 0, sodium: 90, potassium: 3.0, vitaminC: 0, calcium: 3.0, iron: 0, servingUnit: "1 tbsp" },

  // ─── FRUITS ─────────────────────────────────────────────────────
  { name: "Banana", aliases: ["banana", "bananas"], calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14, sodium: 1, potassium: 422, vitaminC: 10, calcium: 6, iron: 0.3, servingUnit: "1 medium" },
  { name: "Apple", aliases: ["apple", "apples"], calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2, potassium: 195, vitaminC: 8.4, calcium: 11, iron: 0.2, servingUnit: "1 medium" },
  { name: "Blueberries", aliases: ["blueberries", "berries", "blueberry"], calories: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6, sugar: 15, sodium: 1, potassium: 114, vitaminC: 14.4, calcium: 9.0, iron: 0.4, servingUnit: "1 cup" },
  { name: "Strawberries", aliases: ["strawberries", "strawberry", "berries"], calories: 49, protein: 1.0, carbs: 12, fat: 0.5, fiber: 3.0, sugar: 7.0, sodium: 1, potassium: 233, vitaminC: 89, calcium: 24, iron: 0.6, servingUnit: "1 cup" },
  { name: "Orange", aliases: ["orange", "oranges", "citrus"], calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, sugar: 12, sodium: 0, potassium: 237, vitaminC: 70, calcium: 52, iron: 0.1, servingUnit: "1 medium" },

  // ─── VEGETABLES ─────────────────────────────────────────────────
  { name: "Broccoli (steamed)", aliases: ["broccoli", "steamed broccoli", "greens"], calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1, sugar: 2.6, sodium: 64, potassium: 457, vitaminC: 135, calcium: 62, iron: 1.1, servingUnit: "1 cup" },
  { name: "Spinach (raw)", aliases: ["spinach", "raw spinach", "greens", "leafy greens"], calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, fiber: 0.7, sugar: 0.1, sodium: 24, potassium: 167, vitaminC: 8.4, calcium: 30, iron: 0.8, servingUnit: "1 cup" },
  { name: "Asparagus (cooked)", aliases: ["asparagus", "spears"], calories: 40, protein: 4.3, carbs: 7.4, fat: 0.4, fiber: 3.6, sugar: 2.5, sodium: 4.0, potassium: 404, vitaminC: 15, calcium: 45, iron: 1.8, servingUnit: "1 cup" },
  { name: "Mixed Green Salad", aliases: ["salad", "lettuce", "greens salad"], calories: 15, protein: 1.0, carbs: 3.0, fat: 0.2, fiber: 1.5, sugar: 1.0, sodium: 10, potassium: 120, vitaminC: 10, calcium: 20, iron: 0.5, servingUnit: "2 cups" },
  { name: "Tomato (raw)", aliases: ["tomato", "tomatoes"], calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5, sugar: 3.2, sodium: 6, potassium: 292, vitaminC: 17, calcium: 12, iron: 0.3, servingUnit: "1 medium" },

  // ─── SUPPLEMENTS & TREATS ───────────────────────────────────────
  { name: "Whey Protein Shake", aliases: ["protein shake", "whey", "protein powder", "shake"], calories: 120, protein: 25, carbs: 3.0, fat: 1.5, fiber: 0, sugar: 2.0, sodium: 130, potassium: 180, vitaminC: 0, calcium: 130, iron: 0.4, servingUnit: "1 scoop" },
  { name: "Casein Protein", aliases: ["casein", "night protein", "slow protein"], calories: 120, protein: 24, carbs: 1.0, fat: 1.0, fiber: 0, sugar: 0, sodium: 160, potassium: 90, vitaminC: 0, calcium: 500, iron: 0.2, servingUnit: "1 scoop" },
  { name: "Protein Bar", aliases: ["protein bar", "snack bar", "bar"], calories: 220, protein: 20, carbs: 24, fat: 7.0, fiber: 6.0, sugar: 2.0, sodium: 210, potassium: 110, vitaminC: 0, calcium: 100, iron: 1.5, servingUnit: "1 bar" },
  { name: "Dark Chocolate (70%)", aliases: ["chocolate", "dark chocolate", "treat"], calories: 170, protein: 2.0, carbs: 15, fat: 12, fiber: 3.0, sugar: 9.0, sodium: 6, potassium: 228, vitaminC: 0, calcium: 20, iron: 3.4, servingUnit: "30g" },
  { name: "Black Coffee", aliases: ["coffee", "black coffee", "espresso", "caffeine"], calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5, potassium: 116, vitaminC: 0, calcium: 5.0, iron: 0, servingUnit: "1 cup" },
  { name: "Green Tea", aliases: ["tea", "green tea", "herbal tea"], calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, potassium: 20, vitaminC: 0, calcium: 0, iron: 0, servingUnit: "1 cup" },
  { name: "Pizza (Cheese)", aliases: ["pizza", "cheese pizza", "slice of pizza"], calories: 285, protein: 12, carbs: 32, fat: 10.4, fiber: 2.5, sugar: 3.8, sodium: 640, potassium: 175, vitaminC: 1.5, calcium: 210, iron: 2.5, servingUnit: "1 slice" },
  { name: "Hamburger", aliases: ["hamburger", "burger", "beef burger"], calories: 354, protein: 20, carbs: 29, fat: 17, fiber: 1.5, sugar: 5.0, sodium: 520, potassium: 280, vitaminC: 1.0, calcium: 60, iron: 3.0, servingUnit: "1 burger" },
  { name: "French Fries", aliases: ["fries", "french fries", "chips"], calories: 365, protein: 4.0, carbs: 48, fat: 17, fiber: 4.4, sugar: 0.3, sodium: 290, potassium: 677, vitaminC: 9.7, calcium: 18, iron: 0.9, servingUnit: "1 medium" },
  { name: "Chicken Caesar Salad", aliases: ["caesar salad", "chicken salad", "salad bowl"], calories: 390, protein: 28, carbs: 12, fat: 26, fiber: 3.0, sugar: 2.0, sodium: 890, potassium: 340, vitaminC: 12, calcium: 150, iron: 1.8, servingUnit: "1 bowl" },
];

const MEAL_LABELS: Record<NutritionEntry["meal"], { label: string; icon: FC<any>; color: string; bg: string }> = {
  breakfast: { label: "Breakfast", icon: Coffee, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20" },
  lunch: { label: "Lunch", icon: UtensilsCrossed, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20" },
  dinner: { label: "Dinner", icon: Moon, color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-500/10 dark:bg-violet-500/15 border-violet-500/20" },
  snack: { label: "Snack", icon: Apple, color: "text-rose-700 dark:text-rose-500", bg: "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20" },
};

// DEFAULT_TARGETS is imported from @/lib/calculators

// Helper to format Date as YYYY-MM-DD
const getLocalDateString = (dateOrStr: Date | string) => {
  const d = typeof dateOrStr === "string" ? new Date(dateOrStr) : dateOrStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// ─── Radial Progress Ring ────────────────────────────────────────
const RingProgress: FC<{ value: number; max: number; className?: string; size?: number; strokeWidth?: number }> = ({
  value, max, className, size = 56, strokeWidth = 5,
}) => {
  const pct = Math.min(value / max, 1);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <svg width={size} height={size} className="rotate-[-90deg] shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-zinc-200 dark:stroke-zinc-800/80" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        className={cn("stroke-emerald-600 dark:stroke-emerald-400", className)}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - dash }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
};

// ─── Macro Bar ───────────────────────────────────────────────────
const MacroBar: FC<{ label: string; value: number; max: number; unit: string; color: string; icon: FC<any>; iconColor: string }> = ({
  label, value, max, unit, color, icon: Icon, iconColor,
}) => {
  const pct = Math.min((value / max) * 100, 100);
  const isOver = value > max;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className={iconColor} aria-hidden="true" />
          <span className="font-semibold text-zinc-900 dark:text-white">{label}</span>
        </div>
        <span className={cn("font-mono font-bold", isOver ? "text-rose-700 dark:text-rose-500" : "text-zinc-700 dark:text-zinc-300")}>
          {value.toFixed(1)}<span className="font-normal text-zinc-600 dark:text-zinc-400">/{max}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800/80 overflow-hidden" aria-hidden="true">
        <motion.div
          className={cn("h-full rounded-full", isOver ? "bg-rose-500" : color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ─── Micro Badge ─────────────────────────────────────────────────
const MicroBadge: FC<{ label: string; value: number; max: number; unit: string; className: string }> = ({
  label, value, max, unit, className,
}) => {
  const pct = Math.min((value / max) * 100, 100);
  const isOver = value > max;

  return (
    <Surface className="flex flex-col items-center gap-1.5 p-3 text-center bg-zinc-50/20 dark:bg-zinc-900/40">
      <div className="relative">
        <RingProgress value={value} max={max} className={isOver ? "stroke-rose-600 dark:stroke-rose-500" : className} size={50} strokeWidth={4.5} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-foreground">
          {Math.round(pct)}%
        </span>
      </div>
      <div>
        <p className="text-[11px] font-bold text-zinc-900 dark:text-white leading-tight">{label}</p>
        <p className="text-[9px] font-mono text-zinc-750 dark:text-zinc-300 mt-0.5">{value.toFixed(0)}/{max}{unit}</p>
      </div>
    </Surface>
  );
};

// Helper to parse serving size text (e.g. "170g", "container (150 g)") to extract weight in grams/ml
const parseServingWeight = (servingText: string): number => {
  if (!servingText) return 100;
  
  // Look inside parentheses first: "1 container (150 g)" -> "150 g"
  const parenMatch = servingText.match(/\(([^)]+)\)/);
  const textToSearch = parenMatch ? parenMatch[1] : servingText;
  
  const weightMatch = textToSearch.match(/(\d+(?:\.\d+)?)\s*(g|ml|grams|ml)/i);
  if (weightMatch) {
    const val = parseFloat(weightMatch[1]);
    if (val > 0) return val;
  }
  
  const globalMatch = servingText.match(/(\d+(?:\.\d+)?)\s*(g|ml|grams|ml)/i);
  if (globalMatch) {
    const val = parseFloat(globalMatch[1]);
    if (val > 0) return val;
  }
  
  const numOnlyMatch = servingText.match(/(\d+(?:\.\d+)?)/);
  if (numOnlyMatch) {
    const val = parseFloat(numOnlyMatch[1]);
    if (val > 0) return val;
  }
  
  return 100;
};

// Map Open Food Facts product structure to our CommonFoodItem shape
const mapOffProductToFoodItem = (product: any): CommonFoodItem => {
  const code = product.code || undefined;
  const name = product.product_name || product.product_name_en || "Unknown Product";
  const brand = product.brands || undefined;
  const nutriments = product.nutriments || {};
  
  // Nutriments per 100g
  const cals100 = parseFloat(nutriments["energy-kcal_100g"] ?? nutriments["energy_100g"] ?? 0) || 0;
  const protein100 = parseFloat(nutriments["proteins_100g"] ?? 0) || 0;
  const carbs100 = parseFloat(nutriments["carbohydrates_100g"] ?? 0) || 0;
  const fat100 = parseFloat(nutriments["fat_100g"] ?? 0) || 0;
  const fiber100 = parseFloat(nutriments["fiber_100g"] ?? 0) || 0;
  const sugar100 = parseFloat(nutriments["sugars_100g"] ?? 0) || 0;
  
  // Minerals in g per 100g, scaled to mg (multiply by 1000)
  const sodium100 = (parseFloat(nutriments["sodium_100g"] ?? 0) || 0) * 1000;
  const potassium100 = (parseFloat(nutriments["potassium_100g"] ?? 0) || 0) * 1000;
  const calcium100 = (parseFloat(nutriments["calcium_100g"] ?? 0) || 0) * 1000;
  const iron100 = (parseFloat(nutriments["iron_100g"] ?? 0) || 0) * 1000;
  const vitC100 = (parseFloat(nutriments["vitamin-c_100g"] ?? 0) || 0) * 1000;

  const servingSizeText = product.serving_size || "";
  const servingWeight = parseServingWeight(servingSizeText);
  const factor = servingWeight / 100;

  return {
    code,
    name,
    brand,
    calories: Math.round(cals100 * factor),
    protein: parseFloat((protein100 * factor).toFixed(1)),
    carbs: parseFloat((carbs100 * factor).toFixed(1)),
    fat: parseFloat((fat100 * factor).toFixed(1)),
    fiber: parseFloat((fiber100 * factor).toFixed(1)),
    sugar: parseFloat((sugar100 * factor).toFixed(1)),
    sodium: Math.round(sodium100 * factor),
    potassium: Math.round(potassium100 * factor),
    vitaminC: parseFloat((vitC100 * factor).toFixed(1)),
    calcium: Math.round(calcium100 * factor),
    iron: parseFloat((iron100 * factor).toFixed(1)),
    servingUnit: servingSizeText || "100g",
    servingWeight,
  };
};

const COUNTRY_OPTIONS = [
  { code: "world", name: "Global", flag: "🌎" },
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "ca", name: "Canada", flag: "🇨🇦" },
  { code: "in", name: "India", flag: "🇮🇳" },
  { code: "au", name: "Australia", flag: "🇦🇺" },
  { code: "fr", name: "France", flag: "🇫🇷" },
  { code: "de", name: "Germany", flag: "🇩🇪" },
  { code: "es", name: "Spain", flag: "🇪🇸" },
  { code: "br", name: "Brazil", flag: "🇧🇷" },
];

// ─── Add Food Modal ──────────────────────────────────────────────
const AddFoodModal: FC<{
  onAdd: (entry: NutritionEntry | NutritionEntry[]) => void;
  onClose: () => void;
  initialMeal: NutritionEntry["meal"];
}> = ({ onAdd, onClose, initialMeal }) => {
  const [meal, setMeal] = useState<NutritionEntry["meal"]>(initialMeal);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CommonFoodItem | null>(null);
  const [servingQty, setServingQty] = useState(1);
  const [mode, setMode] = useState<"search" | "custom">("search");

  // Search sub-tab toggle ("offline" | "live" | "barcode")
  const [searchTab, setSearchTab] = useState<"offline" | "live" | "barcode">("offline");

  // Multi-select selected items: Key -> { food: CommonFoodItem, qty: number }
  const [selectedItems, setSelectedItems] = useState<Record<string, { food: CommonFoodItem; qty: number }>>({});
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);

  // Suggestions & History states
  const [suggestions, setSuggestions] = useState<CommonFoodItem[]>([]);
  const recentSearches = useAtlasStore((s) => s.recentFoodSearches || []) as CommonFoodItem[];
  const addRecentFoodSearch = useAtlasStore((s) => s.addRecentFoodSearch);
  const clearRecentFoodSearches = useAtlasStore((s) => s.clearRecentFoodSearches);
  const removeRecentFoodSearch = useAtlasStore((s) => s.removeRecentFoodSearch);

  // Live brand search state
  const [offlineInput, setOfflineInput] = useState("");
  const [liveSearch, setLiveSearch] = useState("");
  const [liveInput, setLiveInput] = useState("");
  const [searchCountry, setSearchCountry] = useState("world");
  const [liveResults, setLiveResults] = useState<CommonFoodItem[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Barcode search state
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  // Automatically detect country code from browser locale
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.language) {
      const parts = navigator.language.split("-");
      if (parts.length > 1) {
        let country = parts[1].toLowerCase();
        if (country === "gb") country = "uk";
        const supported = ["us", "uk", "fr", "in", "ca", "au", "de", "es", "br"];
        if (supported.includes(country)) {
          setSearchCountry(country);
        }
      }
    }
  }, []);

  // Debounce inputs to prevent keyboard typing lag in the modal
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(offlineInput);
    }, 150);
    return () => clearTimeout(handler);
  }, [offlineInput]);

  const handleLiveSearchTrigger = () => {
    if (liveInput.trim().length >= 3) {
      setLiveSearch(liveInput.trim());
    }
  };

  const handleOfflineInputChange = (val: string) => {
    setOfflineInput(val);
    setSelected(null);
    if (!val.trim()) {
      setSearch("");
    }
  };

  const handleLiveInputChange = (val: string) => {
    setLiveInput(val);
    setSelected(null);
    if (!val.trim()) {
      setLiveSearch("");
    }
  };

  // Custom fields
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customFiber, setCustomFiber] = useState("");

  const filtered = COMMON_FOODS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.aliases && f.aliases.some((alias) => alias.toLowerCase().includes(search.toLowerCase())))
  );

  const nutritionEntries = useAtlasStore((s) => s.nutritionEntries || []);

  // Generate dynamic suggestions on mount or when meal changes
  useEffect(() => {
    const getSuggestionsForMeal = (entries: NutritionEntry[], mealSlot: NutritionEntry["meal"]): CommonFoodItem[] => {
      const mealEntries = entries.filter((e) => e.meal === mealSlot);
      const targetEntries = mealEntries.length > 0 ? mealEntries : entries;

      const counts: Record<string, { entry: NutritionEntry; count: number }> = {};
      for (const entry of targetEntries) {
        const key = `${entry.name.toLowerCase()}`;
        if (!counts[key]) {
          counts[key] = { entry, count: 0 };
        }
        counts[key].count += 1;
      }

      const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
      const list: CommonFoodItem[] = sorted.slice(0, 5).map(({ entry }) => {
        const size = entry.servingSize || 1;
        return {
          name: entry.name,
          calories: Math.round(entry.calories / size),
          protein: parseFloat((entry.protein / size).toFixed(1)),
          carbs: parseFloat((entry.carbs / size).toFixed(1)),
          fat: parseFloat((entry.fat / size).toFixed(1)),
          fiber: parseFloat((entry.fiber / size).toFixed(1)),
          sugar: parseFloat((entry.sugar / size).toFixed(1)),
          sodium: Math.round(entry.sodium / size),
          potassium: Math.round(entry.potassium / size),
          vitaminC: parseFloat((entry.vitaminC / size).toFixed(1)),
          calcium: Math.round(entry.calcium / size),
          iron: parseFloat((entry.iron / size).toFixed(1)),
          servingUnit: entry.servingUnit || "serving",
        };
      });

      // Pad with staples if list is small
      if (list.length < 3) {
        const staples = ["Chicken Breast (cooked)", "Whole Egg", "Banana", "Greek Yogurt (0% fat)", "Oats (dry)"];
        for (const name of staples) {
          if (list.length >= 5) break;
          const food = COMMON_FOODS.find((f) => f.name === name);
          if (food && !list.some((s) => s.name.toLowerCase() === food.name.toLowerCase())) {
            list.push(food);
          }
        }
      }

      return list;
    };

    setSuggestions(getSuggestionsForMeal(nutritionEntries, meal));
  }, [nutritionEntries, meal]);

  const getItemKey = (food: CommonFoodItem) => {
    if (food.code) {
      return `off_${food.code}`;
    }
    return `${food.name.toLowerCase()}_${(food.brand || "").toLowerCase()}`;
  };

  const toggleItemSelection = (food: CommonFoodItem) => {
    const key = getItemKey(food);
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { food, qty: 1 };
        void addRecentFoodSearch(food);
      }
      return next;
    });
  };

  // Fetch Open Food Facts products using location-based subdomain and active flag guard
  useEffect(() => {
    if (searchTab !== "live" || liveSearch.trim().length < 3) {
      setLiveResults([]);
      return;
    }

    let active = true;
    const fetchResults = async () => {
      setIsLoadingLive(true);
      const url = `/api/food?search=${encodeURIComponent(liveSearch)}&country=${searchCountry}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("API call failed");
        const data = await res.json();
        if (!active) return;
        const products = data.products || [];
        const mapped = products.map((p: any) => mapOffProductToFoodItem(p));
        setLiveResults(mapped);
      } catch (err) {
        if (active) {
          console.error("Live search failed:", err);
        }
      } finally {
        if (active) {
          setIsLoadingLive(false);
        }
      }
    };

    void fetchResults();

    return () => {
      active = false;
    };
  }, [liveSearch, searchCountry, searchTab]);

  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;
    setIsBarcodeLoading(true);
    setBarcodeError(null);
    setSelected(null);
    try {
      const url = `/api/food?barcode=${encodeURIComponent(barcode.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Barcode lookup failed");
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const item = mapOffProductToFoodItem(data.product);
        setSelected(item);
        setBarcodeQuery(barcode);
        // Automatically check/select barcode lookup result
        toggleItemSelection(item);
      } else {
        setBarcodeError("Product not found. Try another barcode or scan a sample.");
      }
    } catch (err) {
      console.error("Barcode search failed:", err);
      setBarcodeError("Network error. Please try again.");
    } finally {
      setIsBarcodeLoading(false);
    }
  };

  const handleAdd = () => {
    if (mode === "custom") {
      if (!customName.trim() || !customCal) return;
      const qty = servingQty || 1;
      const entry: NutritionEntry = {
        id: `nutrition-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        meal,
        timestamp: new Date().toISOString(),
        servingSize: qty,
        servingUnit: "serving",
        name: customName.trim(),
        calories: Math.round(parseFloat(customCal) * qty),
        protein: +((parseFloat(customProtein) || 0) * qty).toFixed(1),
        carbs: +((parseFloat(customCarbs) || 0) * qty).toFixed(1),
        fat: +((parseFloat(customFat) || 0) * qty).toFixed(1),
        fiber: +((parseFloat(customFiber) || 0) * qty).toFixed(1),
        sugar: 0,
        sodium: 0,
        potassium: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0,
      };
      onAdd(entry);
      onClose();
    } else {
      // Batch log selected items
      const itemsArray = Object.values(selectedItems);
      if (itemsArray.length === 0) return;

      const entries: NutritionEntry[] = itemsArray.map(({ food, qty }) => {
        const finalName = food.brand ? `${food.brand} - ${food.name}` : food.name;
        return {
          id: `nutrition-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
          meal,
          timestamp: new Date().toISOString(),
          servingSize: qty,
          servingUnit: food.servingUnit,
          name: finalName,
          calories: Math.round(food.calories * qty),
          protein: +((food.protein * qty).toFixed(1)),
          carbs: +((food.carbs * qty).toFixed(1)),
          fat: +((food.fat * qty).toFixed(1)),
          fiber: +((food.fiber * qty).toFixed(1)),
          sugar: +((food.sugar * qty).toFixed(1)),
          sodium: +((food.sodium * qty).toFixed(0)),
          potassium: +((food.potassium * qty).toFixed(0)),
          vitaminC: +((food.vitaminC * qty).toFixed(1)),
          calcium: +((food.calcium * qty).toFixed(0)),
          iron: +((food.iron * qty).toFixed(1)),
        };
      });

      onAdd(entries);
      onClose();
    }
  };

  const selectedCount = Object.keys(selectedItems).length;

  const trayTotals = useMemo(() => {
    const items = Object.values(selectedItems);
    return items.reduce(
      (acc, curr) => ({
        calories: acc.calories + Math.round(curr.food.calories * curr.qty),
        protein: acc.protein + parseFloat((curr.food.protein * curr.qty).toFixed(1)),
        carbs: acc.carbs + parseFloat((curr.food.carbs * curr.qty).toFixed(1)),
        fat: acc.fat + parseFloat((curr.food.fat * curr.qty).toFixed(1)),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedItems]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Add food log item">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full sm:max-w-md bg-card border border-card-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "95dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-card-border">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Add Food</h3>
          <button onClick={onClose} aria-label="Close modal" className="h-8 w-8 flex items-center justify-center rounded-full bg-zinc-150 dark:bg-zinc-800 text-zinc-750 dark:text-zinc-300 hover:text-foreground transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: "calc(95dvh - 120px)" }}>
          {/* Meal selector */}
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Select meal slot">
            {(Object.entries(MEAL_LABELS) as [NutritionEntry["meal"], typeof MEAL_LABELS[keyof typeof MEAL_LABELS]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setMeal(key)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-bold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    meal === key ? `${cfg.bg} ${cfg.color} border-opacity-100` : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl" role="tablist" aria-label="Log method">
            <button role="tab" aria-selected={mode === "search"} onClick={() => setMode("search")} className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500", mode === "search" ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm" : "text-zinc-750 dark:text-zinc-300")}>
              Quick Add
            </button>
            <button role="tab" aria-selected={mode === "custom"} onClick={() => setMode("custom")} className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500", mode === "custom" ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm" : "text-zinc-750 dark:text-zinc-300")}>
              Custom Entry
            </button>
          </div>

          {mode === "search" ? (
            <>
              {/* Search sub-tab selectors */}
              <div className="flex gap-1 p-1 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800" role="tablist" aria-label="Search Source">
                <button
                  role="tab"
                  aria-selected={searchTab === "offline"}
                  onClick={() => { setSearchTab("offline"); setSelected(null); }}
                  className={cn(
                    "flex-1 py-1 text-[11px] font-bold rounded-lg transition focus:outline-none",
                    searchTab === "offline"
                      ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm"
                      : "text-zinc-650 dark:text-zinc-400 hover:text-foreground"
                  )}
                >
                  Common Foods
                </button>
                <button
                  role="tab"
                  aria-selected={searchTab === "live"}
                  onClick={() => { setSearchTab("live"); setSelected(null); }}
                  className={cn(
                    "flex-1 py-1 text-[11px] font-bold rounded-lg transition focus:outline-none",
                    searchTab === "live"
                      ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm"
                      : "text-zinc-650 dark:text-zinc-400 hover:text-foreground"
                  )}
                >
                  Branded Search
                </button>
                <button
                  role="tab"
                  aria-selected={searchTab === "barcode"}
                  onClick={() => { setSearchTab("barcode"); setSelected(null); }}
                  className={cn(
                    "flex-1 py-1 text-[11px] font-bold rounded-lg transition focus:outline-none",
                    searchTab === "barcode"
                      ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm"
                      : "text-zinc-650 dark:text-zinc-400 hover:text-foreground"
                  )}
                >
                  Barcode Lookup
                </button>
              </div>

              {searchTab === "offline" && (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-350" aria-hidden="true" />
                    <input
                      aria-label="Search quick-add database"
                      className="w-full h-9 pl-8 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-zinc-600 dark:placeholder:text-zinc-350"
                      placeholder="Search common foods..."
                      value={offlineInput}
                      onChange={(e) => handleOfflineInputChange(e.target.value)}
                    />
                  </div>

                  {search.trim() ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {filtered.map((food) => {
                        const isChecked = !!selectedItems[getItemKey(food)];
                        return (
                          <button
                            key={food.name}
                            type="button"
                            onClick={() => toggleItemSelection(food)}
                            className={cn(
                              "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                              isChecked
                                ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/65"
                            )}
                          >
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 shrink-0 pointer-events-none"
                              />
                              <div className="truncate">
                                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{food.name}</p>
                                <p className="text-[10px] text-zinc-750 dark:text-zinc-350 font-mono mt-0.5">{food.servingUnit}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-1.5 shrink-0">
                              <div>
                                <p className="text-xs font-black text-zinc-900 dark:text-white">{food.calories} kcal</p>
                                <p className="text-[10px] text-zinc-750 dark:text-zinc-350 font-mono">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {filtered.length === 0 && (
                        <p className="text-xs text-center text-zinc-500 py-4">No matching common foods found. Try "Branded Search".</p>
                      )}
                    </div>
                  ) : (
                    /* Suggestions & History display when search query is empty */
                    <div className="space-y-4 pt-1">
                      {suggestions.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} className="text-emerald-500" /> Suggested for {MEAL_LABELS[meal].label}
                          </h4>
                          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {suggestions.map((food) => {
                              const isChecked = !!selectedItems[getItemKey(food)];
                              return (
                                <button
                                  key={`suggested-${food.name}`}
                                  type="button"
                                  onClick={() => toggleItemSelection(food)}
                                  className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                    isChecked
                                      ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
                                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/65"
                                  )}
                                >
                                  <div className="flex items-center gap-2 max-w-[70%]">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 shrink-0 pointer-events-none"
                                    />
                                    <div className="truncate">
                                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{food.name}</p>
                                      <p className="text-[10px] text-zinc-750 dark:text-zinc-350 font-mono mt-0.5">{food.servingUnit}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex items-center gap-1.5 shrink-0">
                                    <div>
                                      <p className="text-xs font-black text-zinc-900 dark:text-white">{food.calories} kcal</p>
                                      <p className="text-[10px] text-zinc-750 dark:text-zinc-350 font-mono">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {recentSearches.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                              <Activity size={11} className="text-zinc-500" /> Recent Searches
                            </h4>
                            <button type="button" onClick={() => void clearRecentFoodSearches()} className="text-[9px] font-bold text-rose-600 dark:text-rose-455 hover:underline">
                              Clear History
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {recentSearches.map((food, index) => {
                              const isChecked = !!selectedItems[getItemKey(food)];
                              const itemKey = food.code ? `recent-${food.code}` : `recent-${food.name}-${food.brand}-${index}`;
                              return (
                                <div
                                  key={itemKey}
                                  className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition bg-zinc-50 dark:bg-zinc-900/65",
                                    isChecked ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10" : "border-zinc-200 dark:border-zinc-800"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleItemSelection(food)}
                                    className="flex-1 flex items-center gap-2 max-w-[85%] text-left"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 shrink-0 pointer-events-none"
                                    />
                                    <div className="truncate">
                                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{food.name}</p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {food.brand && (
                                          <span className="text-[9px] bg-zinc-150 dark:bg-zinc-800 text-zinc-755 dark:text-zinc-300 px-1 py-0.25 rounded font-bold shrink-0">
                                            {food.brand}
                                          </span>
                                        )}
                                        <span className="text-[9px] text-zinc-700 dark:text-zinc-350 truncate font-mono">
                                          {food.servingUnit}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right">
                                      <p className="text-xs font-black text-zinc-900 dark:text-white">{food.calories} kcal</p>
                                      <p className="text-[10px] text-zinc-750 dark:text-zinc-350 font-mono">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => void removeRecentFoodSearch(food)}
                                      aria-label="Remove search history item"
                                      className="p-1 text-zinc-600 hover:text-rose-500 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded transition shrink-0"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {searchTab === "live" && (
                <>
                  <div className="relative flex gap-1.5 items-center">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-350" aria-hidden="true" />
                      <input
                        aria-label="Search Open Food Facts"
                        className="w-full h-9 pl-8 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-zinc-600 dark:placeholder:text-zinc-350"
                        placeholder="Search brands (press Enter)..."
                        value={liveInput}
                        onChange={(e) => handleLiveInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleLiveSearchTrigger();
                          }
                        }}
                      />
                    </div>
                    <select
                      aria-label="Select search region"
                      value={searchCountry}
                      onChange={(e) => setSearchCountry(e.target.value)}
                      className="h-9 px-2 text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shrink-0 cursor-pointer font-mono"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleLiveSearchTrigger}
                      disabled={liveInput.trim().length < 3}
                      className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-zinc-955 font-bold rounded-xl text-xs flex items-center justify-center shrink-0 shadow active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Search
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500 px-1 select-none">
                    💡 Press <strong>Enter</strong> or tap <strong>Search</strong> to query brand databases.
                  </p>

                  {liveSearch.trim().length >= 3 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {isLoadingLive ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                          <p className="text-xs text-zinc-500">Searching brand databases...</p>
                        </div>
                      ) : (
                        <>
                          {liveResults.map((food, index) => {
                            const isChecked = !!selectedItems[getItemKey(food)];
                            const itemKey = food.code ? `live-${food.code}` : `live-${food.name}-${food.brand}-${index}`;
                            return (
                              <button
                                key={itemKey}
                                type="button"
                                onClick={() => toggleItemSelection(food)}
                                className={cn(
                                  "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                  isChecked
                                    ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/65"
                                )}
                              >
                                <div className="flex items-center gap-2 max-w-[70%]">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 shrink-0 pointer-events-none"
                                  />
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{food.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      {food.brand && (
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1 py-0.5 rounded font-bold shrink-0">
                                          {food.brand}
                                        </span>
                                      )}
                                      <span className="text-[9px] text-zinc-700 dark:text-zinc-350 truncate font-mono">
                                        {food.servingUnit}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-1.5 shrink-0">
                                  <div>
                                    <p className="text-xs font-black text-zinc-900 dark:text-white">{food.calories} kcal</p>
                                    <p className="text-[10px] text-zinc-750 dark:text-zinc-350 font-mono">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {liveResults.length === 0 && (
                            <p className="text-xs text-center text-zinc-500 py-4">No branded products found. Try typing another query.</p>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    /* Suggestions & History display when search query is empty */
                    <div className="space-y-4 pt-1">
                      {recentSearches.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                              <Activity size={11} className="text-zinc-500" /> Recent Searches
                            </h4>
                            <button type="button" onClick={() => void clearRecentFoodSearches()} className="text-[9px] font-bold text-rose-600 dark:text-rose-455 hover:underline">
                              Clear History
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                            {recentSearches.map((food, index) => {
                              const isChecked = !!selectedItems[getItemKey(food)];
                              const itemKey = food.code ? `recent-live-${food.code}` : `recent-live-${food.name}-${food.brand}-${index}`;
                              return (
                                <div
                                  key={itemKey}
                                  className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition bg-zinc-50 dark:bg-zinc-900/65",
                                    isChecked ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10" : "border-zinc-200 dark:border-zinc-800"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleItemSelection(food)}
                                    className="flex-1 flex items-center gap-2 max-w-[85%] text-left"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 shrink-0 pointer-events-none"
                                    />
                                    <div className="truncate">
                                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{food.name}</p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {food.brand && (
                                          <span className="text-[9px] bg-zinc-150 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.25 rounded font-bold shrink-0">
                                            {food.brand}
                                          </span>
                                        )}
                                        <span className="text-[9px] text-zinc-700 dark:text-zinc-350 truncate font-mono">
                                          {food.servingUnit}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right">
                                      <p className="text-xs font-black text-zinc-900 dark:text-white">{food.calories} kcal</p>
                                      <p className="text-[10px] text-zinc-750 dark:text-zinc-350 font-mono">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => void removeRecentFoodSearch(food)}
                                      aria-label="Remove search history item"
                                      className="p-1 text-zinc-600 hover:text-rose-500 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded transition shrink-0"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                          <Search size={22} className="text-zinc-650 dark:text-zinc-450 mb-1.5" />
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">Search Brand Directory</p>
                          <p className="text-[10px] text-zinc-700 dark:text-zinc-350 px-6 mt-0.5">Type in the search bar above to look up branded items worldwide.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {searchTab === "barcode" && (
                <div className="space-y-3">
                  {/* Scanning UI Box */}
                  <div className="relative w-full h-28 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col items-center justify-center select-none">
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
                    <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
                    <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
                    <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-500 rounded-br" />
                    
                    <div className="z-10 flex flex-col items-center gap-1 text-center px-4">
                      {isBarcodeLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                          <p className="text-[10px] text-emerald-400 font-bold mt-1">Retrieving product facts...</p>
                        </>
                      ) : selected ? (
                        <>
                          <Check size={16} className="text-emerald-500 animate-bounce" />
                          <p className="text-[11px] text-emerald-400 font-bold truncate max-w-[240px]">{selected.name}</p>
                          <p className="text-[9px] text-zinc-400 truncate max-w-[200px]">{selected.brand || "Verified Generic"}</p>
                        </>
                      ) : (
                        <>
                          <Barcode size={22} className="text-zinc-650 dark:text-zinc-450" />
                          <p className="text-xs font-bold text-zinc-450">EAN/UPC Scanner Active</p>
                          <p className="text-[9px] text-zinc-550">Fetch global nutrition facts instantly</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Manual Barcode Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        aria-label="Enter EAN/UPC barcode number"
                        className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono placeholder:font-sans placeholder:text-zinc-550"
                        placeholder="Enter barcode..."
                        value={barcodeQuery}
                        onChange={(e) => setBarcodeQuery(e.target.value.replace(/[^0-9]/g, ""))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleBarcodeSearch(barcodeQuery); }}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleBarcodeSearch(barcodeQuery)}
                      disabled={!barcodeQuery.trim() || isBarcodeLoading}
                      className="h-9 px-3 text-xs font-bold shrink-0"
                    >
                      Lookup
                    </Button>
                  </div>

                  {barcodeError && (
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-450 text-center">{barcodeError}</p>
                  )}

                  {/* Simulator samples */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider block">Scan Simulation Samples</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Chobani Yogurt", code: "0894700010137" },
                        { label: "Kirkland Protein Bar", code: "0096619266308" },
                        { label: "Coca Cola Classic Can", code: "5449000000996" },
                        { label: "Quaker Rolled Oats", code: "0030000012001" },
                      ].map((s) => (
                        <button
                          key={s.code}
                          type="button"
                          onClick={() => handleBarcodeSearch(s.code)}
                          className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[9px] font-medium text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-95 transition bg-zinc-50/50 dark:bg-zinc-900/40 truncate"
                        >
                          <p className="font-bold text-zinc-900 dark:text-white truncate">{s.label}</p>
                          <p className="font-mono text-zinc-700 dark:text-zinc-455 mt-0.5">{s.code}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1 block" htmlFor="customName">Food Name *</label>
                <input id="customName" className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder:text-zinc-500" placeholder="e.g. Homemade curry" value={customName} onChange={(e) => setCustomName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Calories (kcal) *", id: "customCal", value: customCal, set: setCustomCal, placeholder: "e.g. 350" },
                  { label: "Protein (g) *", id: "customProtein", value: customProtein, set: setCustomProtein, placeholder: "e.g. 30" },
                  { label: "Carbs (g) *", id: "customCarbs", value: customCarbs, set: setCustomCarbs, placeholder: "e.g. 45" },
                  { label: "Fat (g) *", id: "customFat", value: customFat, set: setCustomFat, placeholder: "e.g. 12" },
                  { label: "Fiber (g)", id: "customFiber", value: customFiber, set: setCustomFiber, placeholder: "e.g. 5" },
                ].map((f) => (
                  <div key={f.id}>
                    <label className="text-[10px] font-bold text-zinc-750 dark:text-zinc-300 mb-1 block" htmlFor={f.id}>{f.label}</label>
                    <input id={f.id} type="number" min="0" className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder:text-zinc-500" placeholder={f.placeholder} value={f.value} onChange={(e) => f.set(e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render standard single Add button for Custom Entry mode only */}
          {mode === "custom" && (
            <Button
              variant="primary"
              className="w-full mt-2"
              disabled={!customName.trim() || !customCal}
              onClick={handleAdd}
            >
              <Plus size={15} /> Add to {MEAL_LABELS[meal].label}
            </Button>
          )}
        </div>

        {/* Pinned Selection Tray at the bottom of the modal */}
        {selectedCount > 0 && mode === "search" && (
          <Surface className="border-t border-card-border p-3 space-y-2.5 bg-zinc-50 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setIsTrayExpanded(!isTrayExpanded)}
              className="w-full flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white"
            >
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 text-[10px] font-black">
                  {selectedCount}
                </span>
                <span>Selected Food Tray</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-700 dark:text-zinc-300 font-mono">
                <span>{trayTotals.calories} kcal</span>
                <ChevronDown size={14} className={cn("transition-transform duration-200", isTrayExpanded && "rotate-180")} />
              </div>
            </button>

            <AnimatePresence>
              {isTrayExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2 max-h-48 overflow-y-auto pr-1 pt-1"
                >
                  {Object.entries(selectedItems).map(([key, { food, qty }]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-xl bg-card border border-card-border text-xs">
                      <div className="max-w-[50%]">
                        <p className="font-bold text-zinc-900 dark:text-white truncate">{food.name}</p>
                        {food.brand && (
                          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate mt-0.5">{food.brand}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 select-none">
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItems(prev => {
                                const next = { ...prev };
                                if (next[key]) {
                                  next[key].qty = Math.max(0.1, +(next[key].qty - 0.5).toFixed(2));
                                }
                                return next;
                              });
                            }}
                            className="h-5 w-5 flex items-center justify-center rounded text-[10px] font-bold text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-[10px] text-foreground">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItems(prev => {
                                const next = { ...prev };
                                if (next[key]) {
                                  next[key].qty = +(next[key].qty + 0.5).toFixed(2);
                                }
                                return next;
                              });
                            }}
                            className="h-5 w-5 flex items-center justify-center rounded text-[10px] font-bold text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-mono font-bold w-12 text-right shrink-0">
                          {Math.round(food.calories * qty)} kcal
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItems(prev => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                          }}
                          className="p-1 text-zinc-600 hover:text-rose-500 transition rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Surface className="p-2 grid grid-cols-4 gap-1 text-center bg-zinc-150/40 dark:bg-zinc-900/40">
                    {[
                      { l: "Cal", v: trayTotals.calories, u: "kcal", c: "text-orange-700 dark:text-orange-400" },
                      { l: "Prot", v: trayTotals.protein.toFixed(1), u: "g", c: "text-blue-700 dark:text-blue-400" },
                      { l: "Carb", v: trayTotals.carbs.toFixed(1), u: "g", c: "text-amber-700 dark:text-amber-400" },
                      { l: "Fat", v: trayTotals.fat.toFixed(1), u: "g", c: "text-rose-700 dark:text-rose-550" },
                    ].map((m) => (
                      <div key={m.l}>
                        <p className={cn("text-xs font-bold leading-tight", m.c)}>{m.v}</p>
                        <p className="text-[8px] text-zinc-600 dark:text-zinc-350 leading-tight">{m.l}</p>
                      </div>
                    ))}
                  </Surface>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="primary"
              className="w-full h-9 text-xs font-bold"
              onClick={handleAdd}
            >
              <Plus size={14} /> Add Selection ({selectedCount} item{selectedCount > 1 ? "s" : ""}) to {MEAL_LABELS[meal].label}
            </Button>
          </Surface>
        )}
      </motion.div>
    </div>
  );
};

// ─── AI Quick Log Helpers ─────────────────────────────────────────
const getCurrentMealTimeSlot = (): "breakfast" | "lunch" | "dinner" | "snack" => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 21) return "dinner";
  return "snack";
};

const parseMealLocally = (text: string): Omit<NutritionEntry, "id" | "meal" | "timestamp">[] => {
  const items: Omit<NutritionEntry, "id" | "meal" | "timestamp">[] = [];
  const parts = text.split(/\s+(?:and|with|\+|\bcon\b)\s+|,\s*/i);

  for (const part of parts) {
    const trimmed = part.trim().toLowerCase();
    if (!trimmed) continue;

    let qty = 1;
    const numMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      qty = parseFloat(numMatch[1]) || 1;
    } else if (trimmed.startsWith("a ") || trimmed.startsWith("an ")) {
      qty = 1;
    }

    const cleanWord = trimmed
      .replace(/(\d+(?:\.\d+)?)/g, "")
      .replace(/\b(?:a|an|the|of|cups|cup|large|scoops|scoop|slices|slice|g|ml|servings|serving|cooked|raw|scrambled|fried|boiled)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanWord) continue;

    let matchedFood = COMMON_FOODS.find((f) =>
      f.name.toLowerCase() === cleanWord
    );

    if (!matchedFood) {
      matchedFood = COMMON_FOODS.find((f) =>
        f.aliases?.some((alias) => alias.toLowerCase() === cleanWord)
      );
    }

    if (!matchedFood) {
      matchedFood = COMMON_FOODS.find((f) =>
        f.name.toLowerCase().includes(cleanWord) ||
        f.aliases?.some((alias) => alias.toLowerCase().includes(cleanWord))
      );
    }

    if (matchedFood) {
      items.push({
        name: matchedFood.name,
        calories: Math.round(matchedFood.calories * qty),
        protein: +((matchedFood.protein * qty).toFixed(1)),
        carbs: +((matchedFood.carbs * qty).toFixed(1)),
        fat: +((matchedFood.fat * qty).toFixed(1)),
        fiber: +((matchedFood.fiber * qty).toFixed(1)),
        sugar: +((matchedFood.sugar * qty).toFixed(1)),
        sodium: Math.round(matchedFood.sodium * qty),
        potassium: Math.round(matchedFood.potassium * qty),
        vitaminC: +((matchedFood.vitaminC * qty).toFixed(1)),
        calcium: Math.round(matchedFood.calcium * qty),
        iron: +((matchedFood.iron * qty).toFixed(1)),
        servingSize: qty,
        servingUnit: matchedFood.servingUnit,
      });
    }
  }

  return items;
};

// ─── Main Component ──────────────────────────────────────────────
export function NutritionTracker() {
  const profile = useAtlasStore((s) => s.profile);
  const workouts = useAtlasStore((s) => s.workouts);
  const weightUnit = useAtlasStore((s) => s.weightUnit);
  const heightUnit = useAtlasStore((s) => s.heightUnit);

  const nutritionEntries = useAtlasStore((s) => s.nutritionEntries || []);
  const waterLogs = useAtlasStore((s) => s.waterLogs || []);
  const addNutritionEntryAction = useAtlasStore((s) => s.addNutritionEntry);
  const addNutritionEntriesAction = useAtlasStore((s) => s.addNutritionEntries);
  const deleteNutritionEntryAction = useAtlasStore((s) => s.deleteNutritionEntry);
  const addWaterLogAction = useAtlasStore((s) => s.addWaterLog);
  const deleteWaterLogAction = useAtlasStore((s) => s.deleteWaterLog);

  // Assign to local variable to avoid renaming throughout the file
  const entries = nutritionEntries;

  // States
  const activeProviderId = useAtlasStore((s) => s.activeProviderId);
  const aiProviders = useAtlasStore((s) => s.aiProviders || []);
  const [quickLogText, setQuickLogText] = useState("");
  const [quickLogMeal, setQuickLogMeal] = useState<NutritionEntry["meal"]>(() => getCurrentMealTimeSlot());
  const [isQuickLogging, setIsQuickLogging] = useState(false);
  const [quickLogFeedback, setQuickLogFeedback] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAddMeal, setSelectedAddMeal] = useState<NutritionEntry["meal"]>("breakfast");
  const [expandedMeal, setExpandedMeal] = useState<NutritionEntry["meal"] | null>("breakfast");
  const [nutritionTab, setNutritionTab] = useState<"overview" | "trends" | "micros">("overview");

  // Custom Date state (Defaults to today, allows selecting any day in history)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Interactive Caloric Engine guide (Closed by default, generic accordion trigger)
  const [showCaloricEngineGuide, setShowCaloricEngineGuide] = useState(false);

  // Hydration custom inputs
  const [customWaterInput, setCustomWaterInput] = useState("");

  // Physique guidance toggle
  const [showBmiGuidance, setShowBmiGuidance] = useState(false);

  // Compute targets via the centralized Mifflin-St Jeor engine in @/lib/calculators.
  // This correctly handles: gender (BMR constant), activityLevel (PAL multiplier),
  // goal text + targetPhysique (calorie adjustment), and gender-aware iron RDA.
  const targets = useMemo(() => calculateNutritionTargets(profile), [profile]);

  // Beginner Guide inner sub-tab selection (lose vs gain vs maintain)
  const [activeGuideGoal, setActiveGuideGoal] = useState<"lose" | "gain" | "maintain">("lose");
  
  useEffect(() => {
    if (targets.goalType) {
      setActiveGuideGoal(targets.goalType);
    }
  }, [targets.goalType]);

  // Date Navigation Helpers
  const targetDateString = useMemo(() => {
    return getLocalDateString(selectedDate);
  }, [selectedDate]);

  // Account creation date to prevent navigating to endless back dates
  const accountCreatedDateString = useMemo(() => {
    if (!profile?.createdAt) {
      // Default fallback: 30 days ago
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return getLocalDateString(d);
    }
    try {
      const d = new Date(profile.createdAt);
      if (isNaN(d.getTime())) {
        throw new Error("Invalid date");
      }
      return getLocalDateString(d);
    } catch {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return getLocalDateString(d);
    }
  }, [profile?.createdAt]);

  const canNavigateBack = useMemo(() => {
    return targetDateString > accountCreatedDateString;
  }, [targetDateString, accountCreatedDateString]);

  const dateLabel = useMemo(() => {
    const todayStr = getLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    const selectedStr = getLocalDateString(selectedDate);

    if (selectedStr === todayStr) return "Today";
    if (selectedStr === yesterdayStr) return "Yesterday";
    
    return selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }, [selectedDate]);

  const isTodaySelected = useMemo(() => {
    return getLocalDateString(selectedDate) === getLocalDateString(new Date());
  }, [selectedDate]);

  const navigateDayOffset = (offset: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      const nextStr = getLocalDateString(next);
      // Limit navigation so they can't go before account creation or in the future
      if (nextStr < accountCreatedDateString) return prev;
      if (nextStr > getLocalDateString(new Date())) return prev;
      return next;
    });
  };

  // Filter food and water entries for the selected date
  const activeEntries = useMemo(() => {
    return entries.filter((e) => getLocalDateString(e.timestamp) === targetDateString);
  }, [entries, targetDateString]);

  const activeWaterLogs = useMemo(() => {
    return waterLogs.filter((w) => getLocalDateString(w.timestamp) === targetDateString);
  }, [waterLogs, targetDateString]);

  // Active day totals
  const totals = useMemo(() => {
    return activeEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
        fiber: acc.fiber + e.fiber,
        sugar: acc.sugar + e.sugar,
        sodium: acc.sodium + e.sodium,
        potassium: acc.potassium + e.potassium,
        vitaminC: acc.vitaminC + e.vitaminC,
        calcium: acc.calcium + e.calcium,
        iron: acc.iron + e.iron,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, potassium: 0, vitaminC: 0, calcium: 0, iron: 0 }
    );
  }, [activeEntries]);

  // Water Total
  const totalWater = useMemo(() => {
    return activeWaterLogs.reduce((sum, w) => sum + w.amount, 0);
  }, [activeWaterLogs]);

  const waterTarget = 2500; // 2.5 Liters

  // Active workouts completed on the selected date
  const activeWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (!w.completedAt) return false;
      return getLocalDateString(w.completedAt) === targetDateString;
    });
  }, [workouts, targetDateString]);

  // Unified Calorie Math: Budget - Consumed + Burned = Remaining
  const burnedCalories = useMemo(() => {
    // Calculate based on real completed workouts
    return activeWorkouts.reduce((sum, w) => {
      const duration = w.durationMinutes || 0;
      // Default to 6 kcal/minute for general physical workouts
      return sum + Math.round(duration * 6);
    }, 0);
  }, [activeWorkouts]);

  const remainingCals = useMemo(() => {
    return Math.max(targets.calories - totals.calories + burnedCalories, 0);
  }, [targets.calories, totals.calories, burnedCalories]);

  const caloriePct = useMemo(() => {
    const netIntake = Math.max(totals.calories - burnedCalories, 0);
    return Math.min(netIntake / targets.calories, 1);
  }, [totals.calories, burnedCalories, targets.calories]);

  // Dynamic Anthropometrics Computations (Moved from Settings to Nutrition)
  const calculatedBmi = useMemo(() => {
    const w = profile?.weight;
    const h = profile?.height;
    if (!w || !h) return null;

    const unit = profile.weightUnit ?? weightUnit;
    const hUnit = profile.heightUnit ?? heightUnit;

    const weightInKg = unit === "lbs" ? w / 2.20462 : w;
    const heightInMeters = hUnit === "in" ? (h * 2.54) / 100 : h / 100;
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);

    let classification = "Normal";
    let color = "text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/5";
    if (bmiValue < 18.5) {
      classification = "Underweight";
      color = "text-yellow-600 dark:text-yellow-400 border-yellow-500/25 bg-yellow-500/5";
    } else if (bmiValue < 25) {
      classification = "Normal Range";
      color = "text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/5";
    } else if (bmiValue < 30) {
      classification = "Overweight";
      color = "text-orange-600 dark:text-orange-400 border-orange-500/25 bg-orange-500/5";
    } else {
      classification = "Obese Range";
      color = "text-rose-600 dark:text-rose-400 border-rose-500/25 bg-rose-500/5";
    }

    return {
      value: bmiValue.toFixed(1),
      classification,
      color,
    };
  }, [profile?.weight, profile?.height, profile?.heightUnit, profile?.weightUnit, heightUnit, weightUnit]);

  // Expandable Physiological Improvement Advisor
  const bmiAdvice = useMemo(() => {
    const w = profile?.weight;
    const h = profile?.height;
    if (!w || !h) return null;

    const unit = profile.weightUnit ?? weightUnit;
    const hUnit = profile.heightUnit ?? heightUnit;

    const weightInKg = unit === "lbs" ? w / 2.20462 : w;
    const heightInMeters = hUnit === "in" ? (h * 2.54) / 100 : h / 100;
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);

    if (bmiValue < 18.5) {
      return {
        title: "Anabolic Recovery Strategy",
        tips: [
          "Caloric Hypertrophy: Maintain a structured daily caloric surplus (+300 to +500 kcal/day) focusing on high-quality nutrient-dense foods (avocados, eggs, nuts, whole grains, and lean meats).",
          "Progressive Overload: Focus on fundamental compound strength movements (squats, chest press, deadlifts) with longer rest intervals (2-3 mins) to stimulate myofibrillar growth.",
          "Restrict Excess Cardio: Limit high-intensity conditioning or long cardio blocks to minimize metabolic burn and preserve energy for muscle synthesis.",
          "Sleep & Recovery: Prioritize 8-9 hours of sleep to optimize natural hormones and tissue repair."
        ],
        badge: "Underweight Insight",
        color: "border-amber-500/15 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20",
        titleColor: "text-amber-800 dark:text-amber-300",
        badgeColor: "bg-amber-500/10 dark:bg-white/10 text-amber-700 dark:text-zinc-300"
      };
    } else if (bmiValue < 25) {
      return {
        title: "Composition Preservation Strategy",
        tips: [
          "Sustain Progressive Loading: Your cellular composition is optimal. Continue gradual progressive overload (intensity/volume) to advance muscle density.",
          "Optimal Protein Target: Fuel active cell repair with 0.8g to 1.2g of protein per lb of bodyweight to maintain and build lean body mass.",
          "Active Rest Modalities: Include brief mobility flows, stretching, or light Zone 1/2 cardio on rest days to enhance circulation and lower fatigue."
        ],
        badge: "Optimal Range",
        color: "border-emerald-500/15 dark:border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20",
        titleColor: "text-emerald-800 dark:text-emerald-400",
        badgeColor: "bg-emerald-500/10 dark:bg-white/10 text-emerald-700 dark:text-zinc-300"
      };
    } else if (bmiValue < 30) {
      return {
        title: "Body Recomposition & LISS Strategy",
        tips: [
          "Targeted Caloric Deficit: Maintain a moderate, sustainable caloric deficit (-250 to -400 kcal/day) while keeping protein intake elevated to safeguard active lean tissues.",
          "Aerobic Conditioning: Incorporate 3 weekly LISS blocks (walking, stationary cycling, elliptical) in Zone 2 (60-70% max HR) to maximize fat oxidation.",
          "Joint Integrity Protection: Target moderate lifting loads with clean, controlled tempos, minimizing heavy spinal axial loading if experiencing joint friction."
        ],
        badge: "Recomposition Guide",
        color: "border-orange-500/15 dark:border-orange-500/20 bg-orange-500/5 dark:bg-orange-950/20",
        titleColor: "text-orange-800 dark:text-orange-400",
        badgeColor: "bg-orange-500/10 dark:bg-white/10 text-orange-700 dark:text-zinc-300"
      };
    } else {
      return {
        title: "CNS Load & Joint Preservation Strategy",
        tips: [
          "Guided Load Isolation: Prioritize machine-based compound exercises and seated lifts to isolate muscle groups while avoiding excessive spinal or joint pressure.",
          "Non-Impact Cardio: Utilize swimming, rowing, or low-resistance stationary cycling to build aerobic capacity with zero lower-body joint impact.",
          "Consistent Hydration & CNS Rest: Drink 3L+ of water daily and ensure at least 48 hours of spacing between heavy training sessions to promote recovery."
        ],
        badge: "Joint Safety Protocol",
        color: "border-rose-500/15 dark:border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20",
        titleColor: "text-rose-800 dark:text-rose-400",
        badgeColor: "bg-rose-500/10 dark:bg-white/10 text-rose-700 dark:text-zinc-300"
      };
    }
  }, [profile?.weight, profile?.height, profile?.heightUnit, profile?.weightUnit, heightUnit, weightUnit]);

  const calculatedProtein = useMemo(() => {
    const w = profile?.weight;
    if (!w) return null;

    const unit = profile.weightUnit ?? weightUnit;
    const weightInLbs = unit === "lbs" ? w : w * 2.20462;
    const physique = profile.targetPhysique || "athletic";

    let multiplier = 1.0;
    if (physique === "shredded") multiplier = 1.2;
    else if (physique === "lean") multiplier = 1.1;
    else if (physique === "athletic") multiplier = 1.0;
    else if (physique === "toned") multiplier = 0.9;
    else if (physique === "bulky") multiplier = 1.0;

    const proteinTarget = weightInLbs * multiplier;
    return {
      value: Math.round(proteinTarget),
      multiplier: multiplier.toFixed(1),
    };
  }, [profile?.weight, profile?.targetPhysique, profile?.weightUnit, weightUnit]);

  // Historical monthly and yearly trend averages calculated dynamically
  const trendsData = useMemo(() => {
    const getStatsForDays = (daysCount: number) => {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - daysCount);
      const limitStr = getLocalDateString(limitDate);

      const filteredFoods = entries.filter((e) => getLocalDateString(e.timestamp) >= limitStr);
      const filteredWater = waterLogs.filter((w) => getLocalDateString(w.timestamp) >= limitStr);

      // Count unique days with logs in this period
      const uniqueDays = new Set([
        ...filteredFoods.map((e) => getLocalDateString(e.timestamp)),
        ...filteredWater.map((w) => getLocalDateString(w.timestamp)),
      ]);
      const daysLogged = Math.max(uniqueDays.size, 1);

      const foodTotals = filteredFoods.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const waterTotal = filteredWater.reduce((sum, w) => sum + w.amount, 0);

      return {
        avgCalories: Math.round(foodTotals.calories / daysLogged),
        avgProtein: Math.round(foodTotals.protein / daysLogged),
        avgCarbs: Math.round(foodTotals.carbs / daysLogged),
        avgFat: Math.round(foodTotals.fat / daysLogged),
        avgWater: Math.round(waterTotal / daysLogged),
        daysLogged: uniqueDays.size,
      };
    };

    return {
      last7Days: getStatsForDays(7),
      last30Days: getStatsForDays(30),
      last12Months: getStatsForDays(365),
    };
  }, [entries, waterLogs]);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogText.trim()) return;

    setIsQuickLogging(true);
    setQuickLogFeedback(null);

    const activeProvider = aiProviders.find((p) => p.id === activeProviderId);
    const hasAi = activeProvider && (activeProvider.type === "ollama" || activeProvider.type === "lmstudio" || !!activeProvider.apiKey);

    try {
      let parsedItems: Omit<NutritionEntry, "id" | "meal" | "timestamp">[] = [];

      if (hasAi) {
        const isLocal = activeProvider.type === "ollama" || activeProvider.type === "lmstudio";
        const apiKey = isLocal ? "" : await decryptString(activeProvider.apiKey!);
        const adapter = getProviderAdapter(activeProvider.type);

        const systemPrompt = `You are a clinical nutrition assistant. Your task is to parse a user's unstructured food log text into a JSON array of food items.
Each item in the array MUST match this TypeScript interface:
interface ParsedMealItem {
  name: string; // Clean, standard name (e.g., 'Whole Egg')
  calories: number; // in kcal
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  fiber: number; // in grams
  sugar: number; // in grams
  sodium: number; // in mg
  potassium: number; // in mg
  vitaminC: number; // in mg
  calcium: number; // in mg
  iron: number; // in mg
  servingSize: number; // number of servings or quantity (e.g. 3, 1.5, 1)
  servingUnit: string; // unit of serving (e.g. 'large', 'cup', '100g', 'scoop')
}

If a food matches any of these standard database items, please use its nutritional stats and scale them by the quantity:
${JSON.stringify(COMMON_FOODS.map(f => ({ name: f.name, aliases: f.aliases, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, servingUnit: f.servingUnit })))}

Do NOT include any markdown code blocks, explanation text, or wrapping objects. Return ONLY the raw JSON array. If the query does not contain recognizable food, return an empty array [].`;

        const userPrompt = `Parse the food log: "${quickLogText}"`;

        const { content } = await adapter.chat({
          provider: activeProvider,
          apiKey,
          messages: [{ id: `quick-log-${Date.now()}`, role: "user", content: userPrompt, createdAt: new Date().toISOString() }],
          systemContext: systemPrompt,
        });

        let cleanContent = content.trim();
        if (cleanContent.startsWith("```json")) {
          cleanContent = cleanContent.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanContent.startsWith("```")) {
          cleanContent = cleanContent.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const items = JSON.parse(cleanContent);
        if (Array.isArray(items)) {
          parsedItems = items.map((item: any) => ({
            name: item.name || "Custom Food",
            calories: Math.round(item.calories || 0),
            protein: +((item.protein || 0).toFixed(1)),
            carbs: +((item.carbs || 0).toFixed(1)),
            fat: +((item.fat || 0).toFixed(1)),
            fiber: +((item.fiber || 0).toFixed(1)),
            sugar: +((item.sugar || 0).toFixed(1)),
            sodium: Math.round(item.sodium || 0),
            potassium: Math.round(item.potassium || 0),
            vitaminC: +((item.vitaminC || 0).toFixed(1)),
            calcium: Math.round(item.calcium || 0),
            iron: +((item.iron || 0).toFixed(1)),
            servingSize: item.servingSize || 1,
            servingUnit: item.servingUnit || "serving",
          }));
        }
      }

      // If AI did not return any items or is not configured, fall back to local parser
      if (parsedItems.length === 0) {
        parsedItems = parseMealLocally(quickLogText);
      }

      if (parsedItems.length === 0) {
        setQuickLogFeedback("Could not recognize any foods. Please try writing it differently (e.g. '3 eggs, 1 banana').");
      } else {
        const targetDate = new Date(selectedDate);
        targetDate.setHours(12, 0, 0, 0);

        for (const item of parsedItems) {
          const finalEntry: NutritionEntry = {
            ...item,
            id: `nutrition-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            meal: quickLogMeal,
            timestamp: targetDate.toISOString(),
          };
          await addNutritionEntryAction(finalEntry);
        }

        setQuickLogText("");
        setQuickLogFeedback(`Successfully logged ${parsedItems.length} item(s) to ${MEAL_LABELS[quickLogMeal].label}!`);
        setTimeout(() => setQuickLogFeedback(null), 4000);
      }
    } catch (err) {
      console.error("AI Quick Log failed, trying local fallback:", err);
      const fallback = parseMealLocally(quickLogText);
      if (fallback.length > 0) {
        const targetDate = new Date(selectedDate);
        targetDate.setHours(12, 0, 0, 0);

        for (const item of fallback) {
          const finalEntry: NutritionEntry = {
            ...item,
            id: `nutrition-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            meal: quickLogMeal,
            timestamp: targetDate.toISOString(),
          };
          await addNutritionEntryAction(finalEntry);
        }
        setQuickLogText("");
        setQuickLogFeedback(`Logged ${fallback.length} item(s) to ${MEAL_LABELS[quickLogMeal].label} (using local fallback).`);
        setTimeout(() => setQuickLogFeedback(null), 4000);
      } else {
        setQuickLogFeedback("Failed to parse log. Please check your spelling or use standard logging.");
      }
    } finally {
      setIsQuickLogging(false);
    }
  };

  // Add food entry stamped with currently selected date
  const handleAddEntry = (entry: NutritionEntry | NutritionEntry[]) => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(12, 0, 0, 0); // avoid UTC shifts
    if (Array.isArray(entry)) {
      const finalEntries = entry.map(e => ({ ...e, timestamp: targetDate.toISOString() }));
      void addNutritionEntriesAction(finalEntries);
    } else {
      const finalEntry = { ...entry, timestamp: targetDate.toISOString() };
      void addNutritionEntryAction(finalEntry);
    }
  };

  // Remove food entry
  const removeEntry = (id: string) => {
    void deleteNutritionEntryAction(id);
  };

  // Add water log stamped with selected date
  const addWater = (amount: number) => {
    if (amount <= 0) return;
    const targetDate = new Date(selectedDate);
    targetDate.setHours(12, 0, 0, 0); // avoid UTC shifts
    const log: WaterLogEntry = {
      id: `water-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amount,
      timestamp: targetDate.toISOString(),
    };
    void addWaterLogAction(log);
  };

  // Delete water log
  const removeWaterLog = (id: string) => {
    void deleteWaterLogAction(id);
  };

  const mealEntries = (meal: NutritionEntry["meal"]) => activeEntries.filter((e) => e.meal === meal);

  // Macro calorie distributions
  const { macroCalories, totalMacroKcal } = useMemo(() => {
    const protein = totals.protein * 4;
    const carbs = totals.carbs * 4;
    const fat = totals.fat * 9;
    const total = protein + carbs + fat || 1;
    return {
      macroCalories: { protein, carbs, fat },
      totalMacroKcal: total,
    };
  }, [totals]);

  // Hydration level helper
  const hydrationRatio = Math.min(totalWater / waterTarget, 1);

  // Top Macro Sources helper
  const getTopMacroSources = (macro: "protein" | "carbs" | "fat" | "fiber") => {
    return [...activeEntries]
      .filter((e) => e[macro] > 0)
      .sort((a, b) => b[macro] - a[macro])
      .slice(0, 3);
  };

  // Micronutrient top contributing foods
  const getTopMicroSources = (micro: "sodium" | "potassium" | "vitaminC" | "calcium" | "iron") => {
    return [...activeEntries]
      .filter((e) => e[micro] > 0)
      .sort((a, b) => b[micro] - a[micro])
      .slice(0, 3);
  };

  const subTabs = [
    { id: "overview" as const, label: "Daily Log", icon: Activity },
    { id: "trends" as const, label: "Trends & Targets", icon: BarChart3 },
    { id: "micros" as const, label: "Micronutrients", icon: Shield },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* ─── Standardized Date Picker Control (Infinite Date Navigation) ─── */}
      <div className="flex items-center justify-between p-1 bg-input border border-input-border rounded-2xl select-none">
        <button
          onClick={() => navigateDayOffset(-1)}
          disabled={!canNavigateBack}
          aria-label="Previous day"
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-xl transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            !canNavigateBack
              ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
              : "hover:bg-white dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-300 hover:text-zinc-955 dark:hover:text-white"
          )}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Clickable center to trigger Date Input Calendar picker */}
        <div className="relative">
          <input
            type="date"
            min={accountCreatedDateString}
            max={getLocalDateString(new Date())}
            value={getLocalDateString(selectedDate)}
            onChange={(e) => {
              if (e.target.value) {
                const valStr = e.target.value;
                if (valStr >= accountCreatedDateString && valStr <= getLocalDateString(new Date())) {
                  // Parse with T12:00:00 to avoid timezone offset shifts
                  setSelectedDate(new Date(valStr + "T12:00:00"));
                }
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            aria-label="Select custom date"
          />
          <button
            type="button"
            className="h-9 px-3 gap-1.5 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-450 shadow-sm border border-input-border text-xs font-black uppercase tracking-wider focus-visible:outline-none"
          >
            <Calendar size={13} aria-hidden="true" />
            <span>{dateLabel}</span>
          </button>
        </div>

        <button
          onClick={() => navigateDayOffset(1)}
          disabled={isTodaySelected}
          aria-label="Next day"
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-xl transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            isTodaySelected
              ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
              : "hover:bg-white dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-300 hover:text-zinc-955 dark:hover:text-white"
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ─── Condensed Sub-Tab Navigation Bar (Overview, Trends/Targets, Micros) ─── */}
      <div className="flex overflow-x-auto scrollbar-none gap-1 p-1 bg-input border border-input-border rounded-2xl select-none" role="tablist" aria-label="Nutrition navigation">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const active = nutritionTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setNutritionTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background active:scale-[0.98]",
                active
                  ? "bg-card text-emerald-450 shadow-sm font-bold"
                  : "text-zinc-750 hover:text-zinc-955"
              )}
            >
              <Icon size={14} className="shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={nutritionTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {nutritionTab === "overview" && (
            <div className="space-y-4">
              {/* Samsung Health-style Smart Quick Log */}
              <Card className="p-4 bg-gradient-to-r from-emerald-500/5 via-sky-500/5 to-transparent border border-card-border shadow-sm">
                <form onSubmit={handleQuickLog} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Sparkles size={13} className="animate-pulse" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-955 dark:text-white">Smart Quick Log</span>
                    </div>
                    {/* Meal selector for quick logging */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-750 font-bold uppercase">Slot:</span>
                      <select
                        aria-label="Select meal slot"
                        value={quickLogMeal}
                        onChange={(e) => setQuickLogMeal(e.target.value as any)}
                        className="h-6 px-1.5 rounded-lg border border-input-border bg-input text-[10px] font-bold text-zinc-955 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickLogText}
                      onChange={(e) => setQuickLogText(e.target.value)}
                      placeholder="Type e.g., '3 scrambled eggs, a banana, and coffee'..."
                      disabled={isQuickLogging}
                      className="flex-1 h-9 px-3 rounded-xl border border-input-border bg-input text-xs text-zinc-955 placeholder:text-zinc-600 dark:placeholder:text-zinc-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                    />
                    <button
                      type="submit"
                      disabled={isQuickLogging || !quickLogText.trim()}
                      className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-650 text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 active:scale-95 disabled:active:scale-100"
                    >
                      {isQuickLogging ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Log</span>
                        </>
                      )}
                    </button>
                  </div>
                  {quickLogFeedback && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      {quickLogFeedback}
                    </motion.p>
                  )}
                </form>
              </Card>
              <Card className="p-5 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(16, 185, 129, 0.015), transparent, rgba(14, 165, 233, 0.015))" }} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch divide-y md:divide-y-0 md:divide-x divide-card-border">
                  {/* Calorie Progress Section */}
                  <div className="flex flex-col justify-between pb-6 md:pb-0 md:pr-8 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                      {/* Radial Progress */}
                      <div className="relative shrink-0 select-none">
                        <RingProgress
                          value={totals.calories}
                          max={targets.calories}
                          className={totals.calories > targets.calories ? "stroke-rose-450" : "stroke-emerald-450"}
                          size={92}
                          strokeWidth={7}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Flame size={20} className={totals.calories > targets.calories ? "text-rose-450 animate-bounce" : "text-emerald-450"} />
                          <span className="text-sm font-black text-zinc-955 mt-0.5 leading-none">
                            {Math.round((totals.calories / targets.calories) * 100) || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Main Calorie Numbers */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-955 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-450" />
                          Daily Balance
                        </h2>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-4xl font-black text-zinc-955 tracking-tight tabular-nums leading-none">
                            {remainingCals.toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-750 font-extrabold uppercase tracking-wider">kcal left</span>
                        </div>
                        <p className="text-[11px] text-zinc-750 font-medium mt-1 leading-snug">
                          Your dynamic calorie fuel target for today.
                        </p>
                      </div>
                    </div>

                    {/* Breakdown Justifying the Math */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-card-border">
                      <div className="bg-surface/50 p-2 rounded-xl border border-surface-border text-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-750 block mb-0.5">Budget</span>
                        <span className="text-sm font-bold text-zinc-955 font-mono">{targets.calories.toLocaleString()}</span>
                      </div>
                      <div className="bg-surface/50 p-2 rounded-xl border border-surface-border text-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-750 block mb-0.5">Food</span>
                        <span className="text-sm font-bold text-rose-450 font-mono">-{totals.calories.toLocaleString()}</span>
                      </div>
                      <div className="bg-surface/50 p-2 rounded-xl border border-surface-border text-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-750 block mb-0.5">Active</span>
                        <span className="text-sm font-bold text-emerald-450 font-mono">+{burnedCalories.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hydration Tracker Section */}
                  <div className="flex flex-col justify-between pt-6 md:pt-0 md:pl-8 space-y-4">
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes wave-slide {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                      }
                      .animate-wave {
                        animation: wave-slide 4s linear infinite;
                      }
                    `}} />
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                      {/* Animated Water Cup with liquid wave */}
                      <div className="relative h-24 w-16 bg-sky-500/5 dark:bg-sky-950/20 border-2 border-sky-400/35 rounded-2xl overflow-hidden flex flex-col justify-end shadow-inner shrink-0 select-none">
                        {/* Wave container */}
                        <motion.div
                          className="w-full bg-sky-500/80 dark:bg-sky-500/85 relative"
                          style={{ height: `${hydrationRatio * 100}%` }}
                          initial={{ height: 0 }}
                          animate={{ height: `${hydrationRatio * 100}%` }}
                          transition={{ type: "spring", stiffness: 65, damping: 15 }}
                        >
                          {/* SVG Wave overlay animating on the top boundary */}
                          {hydrationRatio > 0 && hydrationRatio < 1 && (
                            <svg
                              className="absolute left-0 right-0 w-[200%] h-4 -top-3.5 fill-sky-500/80 dark:fill-sky-500/85 animate-wave"
                              viewBox="0 0 120 28"
                              preserveAspectRatio="none"
                              style={{
                                transform: "translateX(0)",
                              }}
                            >
                              <path d="M0 15 Q 30 0, 60 15 T 120 15 L 120 28 L 0 28 Z" />
                            </svg>
                          )}
                          <div className="absolute inset-x-0 top-1 h-0.5 bg-white/35 blur-[0.5px] pointer-events-none" />
                        </motion.div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                          <Droplets size={18} className={hydrationRatio > 0.4 ? "text-white drop-shadow-sm" : "text-sky-500/60"} />
                          <span className={cn("text-[9px] font-black font-mono leading-none mt-1", hydrationRatio > 0.4 ? "text-white" : "text-sky-500")}>
                            {Math.round(hydrationRatio * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Main Hydration Numbers */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-955 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                          Hydration Log
                        </h2>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-4xl font-black text-zinc-955 tracking-tight tabular-nums leading-none">
                            {totalWater.toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-750 font-bold uppercase tracking-wider">
                            / {waterTarget.toLocaleString()} ml
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-750 font-medium mt-1 leading-snug">
                          Keep your metabolism and energy active.
                        </p>
                      </div>
                    </div>

                    {/* Quick Add and Custom Input Actions */}
                    <div className="space-y-3 pt-3 border-t border-card-border">
                      {/* Stepper adjustment row */}
                      <div className="flex items-center justify-between gap-2.5 bg-sky-500/5 dark:bg-sky-500/10 p-1.5 rounded-2xl border border-sky-500/10 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            const lastLog = activeWaterLogs[activeWaterLogs.length - 1];
                            if (lastLog) {
                              removeWaterLog(lastLog.id);
                            }
                          }}
                          disabled={activeWaterLogs.length === 0}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-sky-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 transition active:scale-90 shadow-sm focus:outline-none"
                          aria-label="Remove last water log"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">Fine Adjust (Last Log)</span>
                        <button
                          type="button"
                          onClick={() => addWater(250)}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-sky-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-90 shadow-sm focus:outline-none"
                          aria-label="Add 250ml water"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick-add buttons */}
                      <div className="flex gap-2">
                        {[
                          { val: 250, label: "Cup" },
                          { val: 500, label: "Bottle" },
                          { val: 750, label: "Shaker" },
                        ].map(({ val, label }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => addWater(val)}
                            className="flex-1 flex flex-col items-center justify-center py-2 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-450 border border-sky-500/20 hover:border-sky-500/40 transition active:scale-[0.97] focus-visible:outline-none"
                          >
                            <span className="text-xs font-black font-mono">+{val}ml</span>
                            <span className="text-[9px] uppercase font-black text-sky-550/80 dark:text-sky-400/80 mt-0.5">{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Custom input */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="10"
                            max="5000"
                            placeholder="Custom amount"
                            value={customWaterInput}
                            onChange={(e) => setCustomWaterInput(e.target.value)}
                            className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-input-border bg-input text-xs text-zinc-955 font-mono placeholder:text-zinc-600 dark:placeholder:text-zinc-350 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition duration-150"
                            aria-label="Custom water amount in ml"
                          />
                          <span className="absolute right-3.5 top-3 text-[10px] text-zinc-750 font-black uppercase tracking-wider select-none">
                            ml
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(customWaterInput);
                            if (val > 0) {
                              addWater(val);
                              setCustomWaterInput("");
                            }
                          }}
                          disabled={!customWaterInput || parseInt(customWaterInput) <= 0}
                          className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider transition active:scale-[0.97] disabled:active:scale-100 disabled:cursor-not-allowed focus-visible:outline-none shrink-0"
                        >
                          Log
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Macro calorie ratio bar */}
                {totals.calories > 0 && (
                  <div className="mt-4 border-t border-card-border pt-3">
                    <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-surface">
                      {[
                        { w: (macroCalories.protein / totalMacroKcal) * 100, c: "bg-blue-455" },
                        { w: (macroCalories.carbs / totalMacroKcal) * 100, c: "bg-amber-450" },
                        { w: (macroCalories.fat / totalMacroKcal) * 100, c: "bg-rose-450" },
                      ].map((seg, i) => (
                        <div key={i} className={cn("h-full", seg.c)} style={{ width: `${seg.w}%` }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {[
                        { label: "Protein", pct: Math.round((macroCalories.protein / totalMacroKcal) * 100), c: "text-blue-455" },
                        { label: "Carbs", pct: Math.round((macroCalories.carbs / totalMacroKcal) * 100), c: "text-amber-450" },
                        { label: "Fat", pct: Math.round((macroCalories.fat / totalMacroKcal) * 100), c: "text-rose-450" },
                      ].map((m) => (
                        <span key={m.label} className={cn("text-[10px] font-extrabold flex items-center gap-1", m.c)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", m.c.replaceAll("text-", "bg-"))} />
                          {m.label} {m.pct}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Physique Metrics Panel */}
              {(calculatedBmi || calculatedProtein) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Sparkles size={14} className="text-emerald-450" />
                    <h3 className="text-xs font-black text-zinc-750 uppercase tracking-widest">Physique Metrics</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {calculatedBmi && (
                      <div className="p-4 rounded-2xl border border-card-border bg-card space-y-2 select-none shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.24)] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase font-mono tracking-widest text-zinc-750">Live Telemetry</span>
                          <h4 className="text-sm font-bold text-zinc-955 mt-1 leading-none">Body Mass Index (BMI)</h4>
                        </div>

                        <div className="py-2 flex items-baseline gap-2">
                          <span className="text-3xl font-black text-zinc-955 font-mono leading-none">{calculatedBmi.value}</span>
                          <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded border ${calculatedBmi.color}`}>
                            {calculatedBmi.classification}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-750 leading-relaxed font-medium">
                          Estimated tissue mass calculations. Standard healthy ranges are between 18.5 and 24.9.
                        </p>

                        {/* BMI Advice Accordion */}
                        {bmiAdvice && (
                          <div className="pt-2 border-t border-card-border mt-2">
                            <button
                              type="button"
                              onClick={() => setShowBmiGuidance(!showBmiGuidance)}
                              className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-750 hover:text-zinc-950 dark:text-zinc-350 dark:hover:text-white bg-zinc-50/50 dark:bg-zinc-900/60 border border-card-border px-2.5 py-1.5 rounded-xl transition duration-200"
                            >
                              <span>{showBmiGuidance ? "Hide Strategy Details" : `Improvement Strategy`}</span>
                              <Info size={14} className="text-zinc-750" />
                            </button>

                            <AnimatePresence>
                              {showBmiGuidance && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden pt-2"
                                >
                                  <div className={`p-3 rounded-xl border ${bmiAdvice.color} text-xs leading-relaxed space-y-1.5`}>
                                    <div className="flex justify-between items-center select-none mb-1">
                                      <span className={`font-black uppercase tracking-wider ${bmiAdvice.titleColor}`}>{bmiAdvice.title}</span>
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono ${bmiAdvice.badgeColor}`}>
                                        {bmiAdvice.badge}
                                      </span>
                                    </div>
                                    <ul className="list-disc pl-3.5 space-y-1 text-zinc-750 font-medium">
                                      {bmiAdvice.tips.map((tip, idx) => (
                                        <li key={idx} className="leading-snug">{tip}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}

                    {calculatedProtein && (
                      <div className="p-4 rounded-2xl border border-card-border bg-card space-y-2 select-none shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.24)] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase font-mono tracking-widest text-zinc-750">Optimal Fueling</span>
                          <h4 className="text-sm font-bold text-zinc-955 mt-1 leading-none">Daily Protein Target</h4>
                        </div>

                        <div className="py-2.5 flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-zinc-955 font-mono leading-none">{calculatedProtein.value}</span>
                          <span className="text-xs font-extrabold text-zinc-750 font-mono">g / day</span>
                        </div>

                        <p className="text-xs text-zinc-750 leading-relaxed font-medium">
                          Physique-goal estimate at <span className="text-zinc-955 font-black font-mono">{calculatedProtein.multiplier}g</span> per lb for your <span className="text-zinc-955 font-black">{profile?.targetPhysique || "athletic"}</span> target. Your macro bar uses a per-kg clinical target based on your activity level.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Collapsible Meal Logging Areas */}
              <div className="space-y-2.5">
                {(Object.entries(MEAL_LABELS) as [NutritionEntry["meal"], typeof MEAL_LABELS[keyof typeof MEAL_LABELS]][]).map(([meal, cfg]) => {
                  const MealIcon = cfg.icon;
                  const items = mealEntries(meal);
                  const mealCals = items.reduce((s, e) => s + e.calories, 0);
                  const mealProtein = items.reduce((s, e) => s + e.protein, 0);
                  const mealCarbs = items.reduce((s, e) => s + e.carbs, 0);
                  const mealFat = items.reduce((s, e) => s + e.fat, 0);
                  const isExpanded = expandedMeal === meal;

                  return (
                    <Card key={meal} className="overflow-hidden">
                      <button
                        aria-expanded={isExpanded}
                        aria-controls={`meal-section-${meal}`}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-surface/50 transition active:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        onClick={() => setExpandedMeal(isExpanded ? null : meal)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-xl border flex items-center justify-center", cfg.bg)}>
                            <MealIcon size={15} className={cfg.color} aria-hidden="true" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-zinc-955">{cfg.label}</p>
                            <p className="text-[10px] text-zinc-750 font-mono">{items.length} logged</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2.5">
                          {items.length > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-mono font-bold select-none mr-0.5 sm:mr-1">
                              <span className="text-blue-455 bg-blue-500/5 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">P:{Math.round(mealProtein)}g</span>
                              <span className="text-amber-450 bg-amber-500/5 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">C:{Math.round(mealCarbs)}g</span>
                              <span className="text-rose-450 bg-rose-500/5 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">F:{Math.round(mealFat)}g</span>
                            </div>
                          )}
                          <span className="text-xs sm:text-sm font-black text-zinc-955 tabular-nums whitespace-nowrap">
                            {mealCals} <span className="text-[9px] sm:text-[10px] font-normal text-zinc-755">kcal</span>
                          </span>
                          {isExpanded ? <ChevronUp size={15} className="text-zinc-750 shrink-0" /> : <ChevronDown size={15} className="text-zinc-750 shrink-0" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            id={`meal-section-${meal}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 space-y-2 border-t border-card-border pt-2.5 bg-surface/20">
                              {items.length === 0 ? (
                                <p className="text-xs text-zinc-750 text-center py-4 italic">No items logged under {cfg.label.toLowerCase()}</p>
                              ) : (
                                items.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-card-border shadow-sm"
                                  >
                                    <div className="min-w-0 flex-1 mr-2">
                                      <p className="text-xs font-bold text-zinc-955 truncate">{entry.name}</p>
                                      <div className="flex gap-2.5 mt-0.5 text-[9px] font-mono">
                                        <span className="text-blue-455 font-bold">P:{entry.protein}g</span>
                                        <span className="text-amber-450 font-bold">C:{entry.carbs}g</span>
                                        <span className="text-rose-450 font-bold">F:{entry.fat}g</span>
                                        {entry.fiber > 0 && <span className="text-emerald-450 font-bold">Fb:{entry.fiber}g</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs font-black text-zinc-955 tabular-nums">{entry.calories} kcal</span>
                                      <button
                                        onClick={() => removeEntry(entry.id)}
                                        aria-label={`Remove ${entry.name}`}
                                        className="h-6 w-6 flex items-center justify-center rounded-lg text-zinc-450 hover:text-rose-450 hover:bg-rose-450/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                              <button
                                onClick={() => { setSelectedAddMeal(meal); setShowAddModal(true); }}
                                className={cn(
                                  "w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed text-xs font-bold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                  cfg.color,
                                  `border-current/40 hover:bg-current/5`
                                )}
                              >
                                <Plus size={13} /> Add food to {cfg.label}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>

              {/* Diagnostics insights */}
              {activeEntries.length > 0 && (
                <Card className="p-4 bg-gradient-to-br from-emerald-450/5 to-emerald-450/[0.02] border border-emerald-450/15">
                  <div className="flex items-center gap-2 mb-2.5">
                    <TrendingUp size={15} className="text-emerald-450" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-450">Nutritional Diagnostics</p>
                  </div>
                  <div className="space-y-2 text-xs text-zinc-750 leading-snug">
                    {totals.protein >= targets.protein * 0.9 ? (
                      <p className="flex items-start gap-2"><Check size={12} className="text-emerald-450 mt-0.5 shrink-0" /> <span>Protein goal is met ({totals.protein}g). Muscle repair is properly supported. 💪</span></p>
                    ) : (
                      <p className="flex items-start gap-2"><Info size={12} className="text-blue-455 mt-0.5 shrink-0" /> <span>You are currently {Math.round(targets.protein - totals.protein)}g short of your protein goal. Add high-protein sources.</span></p>
                    )}
                    {totals.fiber < targets.fiber * 0.5 && (
                      <p className="flex items-start gap-2"><Info size={12} className="text-amber-450 mt-0.5 shrink-0" /> <span>Dietary fiber intake is low ({totals.fiber}g). Add legumes, vegetables, or oats.</span></p>
                    )}
                    {totals.calories < targets.calories * 0.8 && (
                      <p className="flex items-start gap-2"><Zap size={12} className="text-sky-400 mt-0.5 shrink-0" /> <span>Daily energy deficit is deep. You can eat another {remainingCals} kcal to power your metabolic rates.</span></p>
                    )}
                  </div>
                </Card>
              )}

              {/* Water Log List history in Overview */}
              {activeWaterLogs.length > 0 && (
                <Card className="p-4 space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-750">Water Intake History</h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {[...activeWaterLogs].reverse().map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-2 rounded-xl bg-surface/50 border border-card-border">
                        <div className="flex items-center gap-2">
                          <Droplets size={12} className="text-sky-400" />
                          <span className="text-xs font-semibold text-zinc-955 font-mono">{log.amount} ml</span>
                          <span className="text-[9px] text-zinc-750">
                            at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button
                          onClick={() => removeWaterLog(log.id)}
                          aria-label="Remove water log"
                          className="h-6 w-6 flex items-center justify-center rounded text-zinc-450 hover:text-rose-450 hover:bg-rose-450/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Button
                variant="primary"
                className="w-full shadow-md focus-visible:ring-emerald-500"
                onClick={() => { setSelectedAddMeal("breakfast"); setShowAddModal(true); }}
              >
                <Plus size={16} /> Log Food Item
              </Button>
            </div>
          )}

          {/* 2. TRENDS & TARGETS TAB */}
          {nutritionTab === "trends" && (
            <div className="space-y-4">
              {/* Dynamic Caloric Objectives Guide (Generic closed accordion trigger) */}
              <Card className="overflow-hidden">
                <button
                  aria-expanded={showCaloricEngineGuide}
                  aria-controls="caloric-guide-details"
                  onClick={() => setShowCaloricEngineGuide(!showCaloricEngineGuide)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-450/10 flex items-center justify-center text-emerald-450 shrink-0">
                      <Info size={14} aria-hidden="true" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-zinc-955">🧬 Caloric Objectives Demystified</p>
                      <p className="text-[10px] text-zinc-750">Tap to expand deficit, surplus &amp; maintenance breakdowns</p>
                    </div>
                  </div>
                  {showCaloricEngineGuide ? <ChevronUp size={16} className="text-zinc-750" /> : <ChevronDown size={16} className="text-zinc-750" />}
                </button>

                <AnimatePresence>
                  {showCaloricEngineGuide && (
                    <motion.div
                      id="caloric-guide-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-card-border"
                    >
                      <div className="p-4 space-y-4">
                        {/* Selector Tabs inside accordion */}
                        <div className="flex gap-1 p-1 bg-surface border border-surface-border rounded-xl select-none">
                          {[
                            { id: "lose" as const, label: "Weight Loss" },
                            { id: "gain" as const, label: "Muscle Gain" },
                            { id: "maintain" as const, label: "Maintenance" },
                          ].map((tab) => {
                            const active = activeGuideGoal === tab.id;
                            const matchesUserGoal = targets.goalType === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setActiveGuideGoal(tab.id)}
                                className={cn(
                                  "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                  active
                                    ? "bg-card text-emerald-450 shadow-sm font-black"
                                    : "text-zinc-750 hover:text-zinc-955"
                                )}
                              >
                                {tab.label} {matchesUserGoal && "⭐"}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[9px] text-zinc-750 italic text-center select-none">
                          ⭐ denotes your active target, dynamically matched from your profile goal: <strong className="text-zinc-955 capitalize">{profile?.goal || "Not Set"}</strong>.
                        </p>

                        {/* Guide Content Panels */}
                        <Surface className="p-3.5 space-y-3 bg-surface/50">
                          {activeGuideGoal === "lose" && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-bold text-zinc-955">
                                <span>Caloric Deficit</span>
                                <span className="font-mono text-rose-450">TDEE − 500 kcal</span>
                              </div>
                              <p className="text-[11px] text-zinc-750 leading-relaxed">
                                <strong>What is it?</strong> To reduce weight, you must feed your body less energy than it expends. This forces tissues to draw from stored body fat to cover the daily energy gap.
                              </p>
                              <div className="border-t border-card-border/60 pt-2 space-y-1 text-[11px] text-zinc-750 leading-relaxed">
                                <p>💪 <strong>Action Plan:</strong></p>
                                <ul className="list-disc pl-4 space-y-1 mt-1">
                                  <li>Stay near your deficit target of <strong>{(targets.tdee - 500).toLocaleString()} kcal</strong> daily.</li>
                                  <li>Prioritize Protein (<strong>{targets.protein}g</strong>) to prevent the body from breaking down muscle tissues.</li>
                                  <li>Losing 0.5 to 1.5 lbs per week is the safe, sustainable benchmark.</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {activeGuideGoal === "gain" && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-bold text-zinc-955">
                                <span>Caloric Surplus</span>
                                <span className="font-mono text-emerald-450">TDEE + 300 kcal</span>
                              </div>
                              <p className="text-[11px] text-zinc-750 leading-relaxed">
                                <strong>What is it?</strong> Creating new muscle fibers requires extra raw energy. A moderate caloric surplus provides the necessary building materials for tissue synthesis and training energy.
                              </p>
                              <div className="border-t border-card-border/60 pt-2 space-y-1 text-[11px] text-zinc-750 leading-relaxed">
                                <p>🏋️ <strong>Action Plan:</strong></p>
                                <ul className="list-disc pl-4 space-y-1 mt-1">
                                  <li>Eat nutritious whole foods to hit your surplus target of <strong>{(targets.tdee + 300).toLocaleString()} kcal</strong>.</li>
                                  <li>Focus on progressive overload workout schemes. Otherwise, the extra calories will be stored as fat.</li>
                                  <li>Aim for a slow gain rate of 1 to 2 lbs per month.</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {activeGuideGoal === "maintain" && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-bold text-zinc-955">
                                <span>Weight Maintenance</span>
                                <span className="font-mono text-blue-455">TDEE Baseline</span>
                              </div>
                              <p className="text-[11px] text-zinc-750 leading-relaxed">
                                <strong>What is it?</strong> Consuming exactly as many calories as your body expends daily. Keeps your bodyweight steady while supporting consistent recovery.
                              </p>
                              <div className="border-t border-card-border/60 pt-2 space-y-1 text-[11px] text-zinc-750 leading-relaxed">
                                <p>🥛 <strong>Action Plan:</strong></p>
                                <ul className="list-disc pl-4 space-y-1 mt-1">
                                  <li>Keep caloric intake close to your TDEE of <strong>{targets.tdee.toLocaleString()} kcal</strong>.</li>
                                  <li>Good for recomposition (slowly replacing body fat with muscle) and stabilizing metabolism.</li>
                                  <li>Establishes a solid baseline for weight management consistency.</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </Surface>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Energy Formula & Budget calculations */}
              <Card className="p-4 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-750">Energy Balance Formula</h4>
                
                <div className="grid grid-cols-7 items-center justify-between text-center bg-surface/50 border border-surface-border p-3.5 rounded-xl text-zinc-955 select-none">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-750">Budget</p>
                    <p className="text-sm font-black mt-1 font-mono">{targets.calories}</p>
                  </div>
                  <span className="text-xs font-bold text-zinc-400" aria-hidden="true">−</span>
                  <div>
                    <p className="text-[10px] font-bold text-rose-450">Food</p>
                    <p className="text-sm font-black text-rose-450 mt-1 font-mono">{totals.calories}</p>
                  </div>
                  <span className="text-xs font-bold text-zinc-400" aria-hidden="true">+</span>
                  <div>
                    <p className="text-[10px] font-bold text-amber-450">Burned</p>
                    <p className="text-sm font-black text-amber-450 mt-1 font-mono">{burnedCalories}</p>
                  </div>
                  <span className="text-xs font-bold text-zinc-400" aria-hidden="true">=</span>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-450">Left</p>
                    <p className="text-sm font-black text-emerald-450 mt-1 font-mono">{remainingCals}</p>
                  </div>
                </div>

                <div className="divide-y divide-card-border text-[11px] pt-1">
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-zinc-750">Basal Metabolic Rate (BMR)</span>
                    <span className="font-mono text-zinc-750">{targets.bmr} kcal/day</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-zinc-750">Physical Activity Multiplier (1.55x)</span>
                    <span className="font-mono text-zinc-750">+{targets.tdee - targets.bmr} kcal/day</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-bold text-zinc-955">Baseline Expenditure (TDEE)</span>
                    <span className="font-mono font-black text-emerald-450">{targets.tdee} kcal/day</span>
                  </div>
                </div>
              </Card>

              {/* Dynamic Target Macro splits */}
              <Card className="p-4 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-750">Macronutrient Target Split</h4>
                <div className="space-y-4">
                  <MacroBar label="Protein" value={totals.protein} max={targets.protein} unit="g" color="bg-blue-455" icon={Beef} iconColor="text-blue-455" />
                  <MacroBar label="Carbohydrates" value={totals.carbs} max={targets.carbs} unit="g" color="bg-amber-450" icon={Wheat} iconColor="text-amber-450" />
                  <MacroBar label="Fat" value={totals.fat} max={targets.fat} unit="g" color="bg-rose-450" icon={Droplets} iconColor="text-rose-450" />
                  <MacroBar label="Fiber" value={totals.fiber} max={targets.fiber} unit="g" color="bg-emerald-450" icon={Leaf} iconColor="text-emerald-450" />
                </div>
              </Card>

              {/* ─── Historical Trends & Analytics (Weekly, Monthly, Yearly Breakdowns) ─── */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-card-border pb-3">
                  <BarChart3 size={15} className="text-emerald-450" />
                  <h4 className="text-xs font-bold text-zinc-955">Historical Trends &amp; Averages</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                  {/* Last 7 Days */}
                  <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-750 uppercase tracking-wider">Last 7 Days</p>
                      <p className="text-xl font-black text-zinc-955 mt-1.5 font-mono">{trendsData.last7Days.avgCalories} <span className="text-[10px] font-normal text-zinc-750 font-sans">kcal/d</span></p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-750 space-y-1">
                      <div className="flex justify-between font-mono"><span>P:</span><span>{trendsData.last7Days.avgProtein}g</span></div>
                      <div className="flex justify-between font-mono"><span>C:</span><span>{trendsData.last7Days.avgCarbs}g</span></div>
                      <div className="flex justify-between font-mono"><span>F:</span><span>{trendsData.last7Days.avgFat}g</span></div>
                      <div className="flex justify-between font-mono border-t border-card-border/30 pt-1 mt-1 text-sky-400">
                        <span>Water:</span><span>{trendsData.last7Days.avgWater}ml</span>
                      </div>
                    </div>
                  </Surface>

                  {/* Last 30 Days (Monthly Breakdown) */}
                  <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-750 uppercase tracking-wider">Last 30 Days</p>
                      <p className="text-xl font-black text-zinc-955 mt-1.5 font-mono">{trendsData.last30Days.avgCalories} <span className="text-[10px] font-normal text-zinc-750 font-sans">kcal/d</span></p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-750 space-y-1">
                      <div className="flex justify-between font-mono"><span>P:</span><span>{trendsData.last30Days.avgProtein}g</span></div>
                      <div className="flex justify-between font-mono"><span>C:</span><span>{trendsData.last30Days.avgCarbs}g</span></div>
                      <div className="flex justify-between font-mono"><span>F:</span><span>{trendsData.last30Days.avgFat}g</span></div>
                      <div className="flex justify-between font-mono border-t border-card-border/30 pt-1 mt-1 text-sky-400">
                        <span>Water:</span><span>{trendsData.last30Days.avgWater}ml</span>
                      </div>
                    </div>
                  </Surface>

                  {/* Last 12 Months (Yearly Breakdown) */}
                  <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-750 uppercase tracking-wider">Last 12 Months</p>
                      <p className="text-xl font-black text-zinc-955 mt-1.5 font-mono">{trendsData.last12Months.avgCalories} <span className="text-[10px] font-normal text-zinc-750 font-sans">kcal/d</span></p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-750 space-y-1">
                      <div className="flex justify-between font-mono"><span>P:</span><span>{trendsData.last12Months.avgProtein}g</span></div>
                      <div className="flex justify-between font-mono"><span>C:</span><span>{trendsData.last12Months.avgCarbs}g</span></div>
                      <div className="flex justify-between font-mono"><span>F:</span><span>{trendsData.last12Months.avgFat}g</span></div>
                      <div className="flex justify-between font-mono border-t border-card-border/30 pt-1 mt-1 text-sky-400">
                        <span>Water:</span><span>{trendsData.last12Months.avgWater}ml</span>
                      </div>
                    </div>
                  </Surface>
                </div>
                <p className="text-[9px] text-zinc-750 italic text-center">
                  * Analytics compile your real daily averages based on logged logs across the active tracking windows.
                </p>
              </Card>
            </div>
          )}

          {/* 3. MICRONUTRIENTS TAB */}
          {nutritionTab === "micros" && (
            <div className="space-y-4">
              {/* Comprehensive RDA Grid */}
              <Card className="p-4 space-y-3.5">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-750">Vitamins & Minerals Progress (RDA)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <MicroBadge label="Sodium" value={totals.sodium} max={targets.sodium} unit="mg" className="stroke-amber-450" />
                  <MicroBadge label="Potassium" value={totals.potassium} max={targets.potassium} unit="mg" className="stroke-violet-455" />
                  <MicroBadge label="Vitamin C" value={totals.vitaminC} max={targets.vitaminC} unit="mg" className="stroke-amber-450" />
                  <MicroBadge label="Calcium" value={totals.calcium} max={targets.calcium} unit="mg" className="stroke-blue-455" />
                  <MicroBadge label="Iron" value={totals.iron} max={targets.iron} unit="mg" className="stroke-rose-450" />
                </div>
              </Card>

              {/* RDA reference table */}
              <Card className="p-4 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-750">Guideline Thresholds</h4>
                <div className="divide-y divide-card-border text-xs">
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-foreground">Sodium</span>
                    <span className="text-zinc-750">Keep below 2,300 mg (prevents fluid retention)</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-foreground">Potassium</span>
                    <span className="text-zinc-750">Aim for 4,700 mg (supports heart/muscle function)</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-foreground">Vitamin C</span>
                    <span className="text-zinc-750">Aim for 90 mg (promotes immune health)</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-foreground">Calcium</span>
                    <span className="text-zinc-750">Aim for 1,000 mg (essential for bone structure)</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-foreground">Iron</span>
                    <span className="text-zinc-750">Aim for 8 mg (supports blood oxygenation)</span>
                  </div>
                </div>
              </Card>

              {/* Micro Sources logs */}
              <Card className="p-4 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-750">Top Micronutrient Source Foods</h4>
                {activeEntries.length === 0 ? (
                  <p className="text-xs text-zinc-750 text-center py-4 italic">No logged foods to display micro sources</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Potassium Sources */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-violet-455 flex items-center gap-1"><Shield size={12} aria-hidden="true" /> Top Potassium Sources</p>
                      <div className="space-y-1.5">
                        {getTopMicroSources("potassium").length === 0 ? (
                          <p className="text-[10px] text-zinc-750 italic">None logged</p>
                        ) : (
                          getTopMicroSources("potassium").map((food) => (
                            <Surface key={food.id} className="text-xs p-2.5 flex justify-between items-center bg-surface/50">
                              <span className="truncate pr-1 text-foreground font-semibold">{food.name}</span>
                              <span className="font-mono font-bold text-violet-455 shrink-0">{food.potassium}mg</span>
                            </Surface>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Vitamin C Sources */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-450 flex items-center gap-1"><Shield size={12} aria-hidden="true" /> Top Vitamin C Sources</p>
                      <div className="space-y-1.5">
                        {getTopMicroSources("vitaminC").length === 0 ? (
                          <p className="text-[10px] text-zinc-750 italic">None logged</p>
                        ) : (
                          getTopMicroSources("vitaminC").map((food) => (
                            <Surface key={food.id} className="text-xs p-2.5 flex justify-between items-center bg-surface/50">
                              <span className="truncate pr-1 text-foreground font-semibold">{food.name}</span>
                              <span className="font-mono font-bold text-amber-450 shrink-0">{food.vitaminC}mg</span>
                            </Surface>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add food modal overlay */}
      <AnimatePresence>
        {showAddModal && (
          <AddFoodModal
            initialMeal={selectedAddMeal}
            onAdd={handleAddEntry}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
