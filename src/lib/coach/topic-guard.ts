/**
 * topic-guard.ts
 * ──────────────────────────────────────────────────────────────
 * Client-side content guardrail for Atlas AI Coach.
 * Restricts all AI interactions to app-related topics (fitness,
 * nutrition, body health, coaching, app feature inquiries) and
 * blocks off-topic queries (coding, politics, academic, etc.).
 */

export interface GuardResult {
  allowed: boolean;
  reason: string;
}

export const BLOCKED_REASON =
  "I can only help with fitness, nutrition, health, and app-related questions. Please ask something related to your training, diet, or the Atlas app.";

export const EMPTY_REASON = "Please type a message before sending.";

// ─── Whitelist Keyword Families ───────────────────────────────

const FITNESS_KEYWORDS = [
  "workout", "workouts", "exercise", "exercises", "sets", "reps",
  "weight", "weights", "barbell", "dumbbell", "kettlebell", "band",
  "bands", "squat", "squats", "deadlift", "deadlifts", "bench", "press",
  "bench press", "overhead press", "pull-up", "pull-ups", "pullup", "pullups",
  "push-up", "push-ups", "pushup", "pushups", "cardio", "hiit",
  "strength", "hypertrophy", "muscle", "muscles", "gains", "gain",
  "tone", "flexibility", "mobility", "stretching", "stretch", "warm-up",
  "warmup", "cool-down", "cooldown", "form", "technique", "rir", "rpe",
  "progressive overload", "overload", "deload", "split", "splits",
  "routine", "routines", "program", "programs", "training", "gym",
  "gyms", "lift", "lifting", "lifter", "compound", "isolation",
  "superset", "supersets", "circuit", "tempo", "volume", "intensity",
  "rest", "recovery", "cardiovascular", "treadmill", "elliptical",
  "stationary-bike", "stairclimber", "plyometric", "plyometrics",
  "crossfit", "powerlifting", "bodybuilding", "snatch", "thruster",
  "burpee", "burpees", "conditioning", "endurance", "stamina", "agility",
  "foam roll", "foam roller", "yoga", "pilates", "barre", "workout plan",
  "leg day", "arm day", "chest day", "back day", "upper body", "lower body",
  "full body",
];

const NUTRITION_KEYWORDS = [
  "nutrition", "diet", "dieting", "protein", "carbs", "carbohydrates",
  "carb", "calories", "calorie", "kcal", "macro", "macros",
  "macronutrient", "macronutrients", "micronutrient", "micronutrients",
  "vitamin", "vitamins", "mineral", "minerals", "meal", "meals",
  "food", "foods", "eating", "supplement", "supplements", "creatine",
  "whey", "casein", "bcaa", "pre-workout", "preworkout", "post-workout",
  "postworkout", "hydration", "fiber", "fibre", "sodium", "keto",
  "ketogenic", "vegan", "vegetarian", "paleo", "intermittent fasting",
  "fasting", "bulking", "bulk", "cutting", "deficit", "surplus", "tdee",
  "bmr", "allergy", "allergies", "intolerance", "intolerances", "gluten",
  "dairy", "peanut", "peanuts", "shellfish", "soy", "lactose", "celiac",
  "breakfast", "lunch", "dinner", "snack", "snacks", "smoothie",
  "shake", "ingredient", "ingredients", "portion", "portions", "serving",
  "servings", "omega-3", "omega-6", "fish oil", "multivitamin",
  "magnesium", "potassium", "caffeine", "electrolyte", "electrolytes",
  "collagen", "glutamine", "beta-alanine", "citrulline", "fruit",
  "fruits", "vegetable", "vegetables", "veggies", "oats", "oatmeal",
  "chicken", "beef", "salmon", "tuna", "tofu", "legumes", "beans",
  "lentils", "quinoa", "avocado", "olive oil", "yogurt", "cottage cheese",
  "meal plan", "meal prep", "cheat meal",
];

const BODY_HEALTH_KEYWORDS = [
  "bmi", "body fat", "bodyfat", "lean mass", "waist measurement",
  "sleep", "stress", "energy", "soreness", "sore", "injury",
  "injuries", "injured", "pain", "fatigue", "fatigued", "tired",
  "readiness", "health", "healthy", "wellness", "heart rate",
  "blood pressure", "posture", "spine", "joint", "joints", "tendon",
  "tendons", "ligament", "ligaments", "inflammation", "swelling",
  "rehab", "rehabilitation", "physical therapy", "physiotherapy",
  "chiropractor", "hormones", "testosterone", "cortisol", "insulin",
  "metabolism", "metabolic", "bone density", "osteoporosis",
  "mental health", "anxiety", "discipline", "consistency", "plateau",
  "habit", "habits", "mindset", "confidence", "burnout", "overweight",
  "underweight", "obesity", "obese", "blood sugar", "cholesterol",
  "diabetes", "hypertension", "lose weight", "gain weight", "weight loss",
  "weight gain", "shredded", "ripped", "fitness", "body composition",
  "dexa", "body weight", "muscle recovery", "rest day", "active recovery",
  "motivation", "progress",
];

const APP_KEYWORDS = [
  "atlas", "atlas app", "atlas ai", "coach screen", "coach tab",
  "coach feature", "workout log", "workout history", "workout tracker",
  "nutrition log", "nutrition tracker", "profile settings", "ai provider",
  "api key", "dark mode", "light mode", "streak", "streaks",
  "achievement", "achievements", "dashboard", "analytics", "sync data",
  "export data", "workout plan",
];

/** All allowed keywords flattened into a single set for fast lookup. */
const ALL_ALLOWED_WORDS = new Set([
  ...FITNESS_KEYWORDS,
  ...NUTRITION_KEYWORDS,
  ...BODY_HEALTH_KEYWORDS,
  ...APP_KEYWORDS,
]);

// ─── Off-Topic Patterns (blacklist) ──────────────────────────

const HARD_OFFTOPIC_PATTERNS: RegExp[] = [
  // Programming / coding actions & instructions (Always Block)
  /\b(?:write (?:me )?(?:a |some )?code|write (?:a )?(?:script|function|class|query|component|program))\b/i,
  /\b(?:fix (?:this |my )?(?:code|bug|error|script))\b/i,
  /\b(?:how to (?:code|program|debug|compile|deploy))\b/i,
  /\b(?:programming language|coding homework|coding project)\b/i,
  /\b(?:python|javascript|typescript|c\+\+|golang|html|css|react|angular|vue|nosql|mongodb|postgres)\b/i,
  /\b(?:sql query|react component|html css|git(?:hub)? repo|git(?:hub)? repository)\b/i,

  // Creative tasks & requests (Always Block)
  /\btell me a joke\b/i,
  /\bwrite (?:me )?a (?:poem|song|story|letter|essay|novel|script)\b/i,
  /\bwrite (?:an? )?essay\b/i,
  /\btranslate this|translation\b/i,

  // Politics / religion (Always Block)
  /\b(?:election|elections|president|presidential|political|politics|democrat|republican|congress|senate|senator|parliament|vote|voting|ballot|campaign|liberal|conservative|left-?wing|right-?wing|socialism|communism|capitalism|fascism|marxism|legislation|amendment|supreme court)\b/i,
  /\b(?:religion|religious|church|mosque|temple|synagogue|prayer|pray|praying|scripture|bible|quran|torah|buddhism|hinduism|christianity|islam|atheism|agnostic)\b/i,

  // Financial actions & investing (Always Block)
  /\b(?:how (?:to|do i) invest)\b/i,
  /\binvest(?:ing)? in\b/i,
  /\b(?:buy (?:bitcoin|crypto|stocks|shares|ethereum|dogecoin|nft))\b/i,
  /\b(?:stock market|cryptocurrency trading|forex trading)\b/i,
  /\b(?:stock|share) price of\b/i,

  // Specific trivia / general knowledge questions (Always Block)
  /\bwhat is the capital of\b/i,
  /\bwho won the (?:election|presidential|world cup|super bowl)\b/i,
  /\b(?:latest news|breaking news|current events|weather forecast|horoscope|zodiac|astrology)\b/i,
  /\b(?:explain (?:quantum|relativity|the theory)|theory of relativity)\b/i,
];

const SOFT_OFFTOPIC_PATTERNS: RegExp[] = [
  // Programming terminology (Block only if no allowed keyword present)
  /\b(?:java\b|rust\b|ruby|php|swift|kotlin|node\.?js|sql|redis|docker|kubernetes|webpack|npm|pip|api\b|sdk|algorithm|compile|compiler|debug|debugging|deploy|deployment|repository|repo|codebase|variable|class\b|object\b|loop|array|boolean|integer|regex|server|client|backend|frontend|fullstack|devops|microservice|lambda|terraform|ansible|ci\/cd|programming|programmer|coder|coding)\b/i,
  /\b(?:component|framework|library|module|package|dependency)\b/i,

  // Academic / homework (Block only if no allowed keyword present)
  /\b(?:homework|thesis|dissertation|exam|examination|quiz|school|university|college|professor|lecture|semester|assignment|textbook|curriculum|syllabus|gpa|grading|calculus|algebra|geometry|trigonometry|physics|chemistry|biology(?! (?:of|behind)))\b/i,

  // Entertainment (Block only if no allowed keyword present)
  /\b(?:movie|movies|film|films|tv show|tv series|netflix|hulu|disney\+?|hbo|anime|manga|comic|comics|gaming|video game|playstation|xbox|nintendo|twitch|youtube|spotify|podcast|celebrity|gossip|fiction)\b/i,

  // Finance / crypto - soft terms (Block only if no allowed keyword present)
  /\b(?:stock|stocks|bitcoin|crypto|cryptocurrency|ethereum|blockchain|nft|trading|forex|investment|investing|portfolio|dividend|bond|bonds|mutual fund|hedge fund|ipo|market cap|wall street|nasdaq|dow jones)\b/i,

  // Relationships / personal life (Block only if no allowed keyword present)
  /\b(?:relationship|dating|romance|boyfriend|girlfriend|marriage|divorce|wedding)\b/i,
  /\b(?:travel|vacation|hotel|flight|airline|passport|visa|tourism|tourist)\b/i,
  /\b(?:real estate|mortgage|landlord|tenant)\b/i,
  /\b(?:lawsuit|lawyer|attorney|litigation)\b/i,

  // Sports/events as general trivia (Block only if no allowed keyword present)
  /\b(?:world cup|super bowl|championship|playoff|oscars|grammy|emmy)\b/i,

  // General trivia starts (Block only if no allowed keyword present)
  /\bwho (?:is|was|are|were) \w/i,
  /\bwhat year (?:was|did|is)\b/i,
];

// ─── Multi-word phrase matching ──────────────────────────────

/**
 * Check whether normalised input contains any keyword from the
 * allowed vocabulary. Handles multi-word phrases correctly.
 */
function containsAllowedKeyword(normalised: string): boolean {
  for (const keyword of ALL_ALLOWED_WORDS) {
    if (keyword.includes(" ")) {
      if (normalised.includes(keyword)) return true;
    } else {
      const re = new RegExp(`\\b${escapeRegExp(keyword)}\\b`);
      if (re.test(normalised)) return true;
    }
  }
  return false;
}

/** Escape special regex characters in a string. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Main Classifier ─────────────────────────────────────────

/**
 * Determines whether a user message is relevant to the Atlas
 * fitness app and should be forwarded to the AI provider.
 *
 * @param input  Raw user input string.
 * @returns      A `GuardResult` with `allowed` and `reason`.
 */
export function checkTopicRelevance(input: string): GuardResult {
  // 1. Empty / whitespace-only → block
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { allowed: false, reason: EMPTY_REASON };
  }

  const normalised = trimmed.toLowerCase();

  // 2. Check for hard off-topic patterns FIRST (Always Block)
  const hasHardOffTopic = HARD_OFFTOPIC_PATTERNS.some((re) => re.test(normalised));
  if (hasHardOffTopic) {
    return { allowed: false, reason: BLOCKED_REASON };
  }

  // 3. Check for soft off-topic patterns
  const hasSoftOffTopic = SOFT_OFFTOPIC_PATTERNS.some((re) => re.test(normalised));

  // 4. Check for allowed keywords
  const hasAllowed = containsAllowedKeyword(normalised);

  // 5. Decision matrix:
  //    • If it matches a soft off-topic pattern AND has no allowed keywords → Block
  if (hasSoftOffTopic && !hasAllowed) {
    return { allowed: false, reason: BLOCKED_REASON };
  }

  //    • Otherwise, if it has allowed keywords → Allow
  if (hasAllowed) {
    return { allowed: true, reason: "" };
  }

  // 6. No strong signal either way — allow by default
  return { allowed: true, reason: "" };
}
