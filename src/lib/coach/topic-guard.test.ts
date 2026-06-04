import { describe, it, expect } from "vitest";
import { checkTopicRelevance, type GuardResult } from "./topic-guard";

// ─── Helpers ─────────────────────────────────────────────────

/** Assert a message is allowed through the guardrail. */
function expectAllowed(input: string) {
  const result = checkTopicRelevance(input);
  expect(result.allowed, `Expected ALLOWED but got BLOCKED: "${input}" — reason: ${result.reason}`).toBe(true);
}

/** Assert a message is blocked by the guardrail. */
function expectBlocked(input: string) {
  const result = checkTopicRelevance(input);
  expect(result.allowed, `Expected BLOCKED but got ALLOWED: "${input}"`).toBe(false);
  expect(result.reason.length).toBeGreaterThan(0);
}

// ═════════════════════════════════════════════════════════════
// TEST SUITE
// ═════════════════════════════════════════════════════════════

describe("topic-guard — AI Content Guardrails", () => {

  // ─── Group 1: Allowed — Fitness & Exercise ─────────────────

  describe("Allowed: Fitness & Exercise queries", () => {
    const cases = [
      "How do I perform a proper deadlift?",
      "Give me a 3-day push pull legs split",
      "What's the best rep range for hypertrophy?",
      "I feel sore after yesterday's workout",
      "How many sets should I do for biceps?",
      "Can you suggest a warm-up routine?",
      "What's progressive overload?",
      "Help me with my squat form",
      "I'm new to the gym — where do I start?",
      "Should I do cardio before or after weights?",
      "What's a good full body program for beginners?",
      "How long should I rest between sets?",
      "My bench press has been stuck at 60kg for weeks",
      "What is the difference between compound and isolation exercises?",
      "How do I train for a 5k run?",
      "Can I do HIIT every day?",
      "What does RPE mean?",
      "Explain the concept of deload weeks",
      "I want to start powerlifting",
      "How do I improve my pull-up count?",
    ];

    cases.forEach((msg) => {
      it(`allows: "${msg}"`, () => expectAllowed(msg));
    });
  });

  // ─── Group 2: Allowed — Nutrition & Diet ───────────────────

  describe("Allowed: Nutrition & Diet queries", () => {
    const cases = [
      "What should I eat before a workout?",
      "How much protein do I need daily?",
      "Suggest a high-protein breakfast",
      "Is creatine safe for beginners?",
      "What's the difference between bulking and cutting?",
      "I'm allergic to peanuts, what protein sources can I use?",
      "How many calories should I eat to lose weight?",
      "Can you give me a meal plan for muscle gain?",
      "What are good sources of healthy fats?",
      "Should I take a multivitamin?",
      "How important is fiber in my diet?",
      "What supplements do you recommend for recovery?",
      "How much water should I drink per day?",
      "Is intermittent fasting good for fat loss?",
      "What's a good post-workout shake recipe?",
    ];

    cases.forEach((msg) => {
      it(`allows: "${msg}"`, () => expectAllowed(msg));
    });
  });

  // ─── Group 3: Allowed — Body & Health ──────────────────────

  describe("Allowed: Body & Health queries", () => {
    const cases = [
      "Why is sleep important for muscle recovery?",
      "My shoulder hurts after bench press",
      "How do I reduce body fat percentage?",
      "What's a healthy BMI range?",
      "I feel tired and low energy today",
      "How does stress affect my training?",
      "Is it okay to work out when sick?",
      "What causes muscle cramps?",
      "How do I fix bad posture?",
      "My joints ache after heavy squats",
      "Can I train through a minor injury?",
      "How do I improve my flexibility?",
      "What's a normal heart rate during exercise?",
    ];

    cases.forEach((msg) => {
      it(`allows: "${msg}"`, () => expectAllowed(msg));
    });
  });

  // ─── Group 4: Allowed — App-Related ────────────────────────

  describe("Allowed: App-related queries", () => {
    const cases = [
      "How do I change my workout plan?",
      "Can you explain the coach feature?",
      "How do I log a workout?",
      "What does RIR mean in the app?",
      "Help me set up my profile",
      "How do I export my training data?",
      "Where can I see my progress chart?",
      "How do I sync my data?",
      "What are the app settings for?",
      "I want to track my goals",
      "How do I use the timer feature?",
      "Give me tips for using this app better",
      "How do I improve my routine?",
    ];

    cases.forEach((msg) => {
      it(`allows: "${msg}"`, () => expectAllowed(msg));
    });
  });

  // ─── Group 5: Allowed — Motivation & Coaching ──────────────

  describe("Allowed: Motivation & coaching context", () => {
    const cases = [
      "I've been feeling stuck and unmotivated lately",
      "How do I stay consistent with my training?",
      "I hit a plateau, what do I do?",
      "How to build discipline for working out?",
      "I lack confidence in the gym",
      "How do I form better habits around fitness?",
    ];

    cases.forEach((msg) => {
      it(`allows: "${msg}"`, () => expectAllowed(msg));
    });
  });

  // ─── Group 6: BLOCKED — Off-Topic ─────────────────────────

  describe("Blocked: Off-topic queries", () => {
    const cases = [
      "Write me a Python script to sort arrays",
      "Who won the 2024 presidential election?",
      "Tell me a joke",
      "What's the best Netflix show right now?",
      "Help me with my math homework",
      "Write an essay about climate change",
      "What is the capital of France?",
      "Translate this sentence to Spanish: hello world",
      "How do I invest in Bitcoin?",
      "Write a poem about love",
      "What's the latest news?",
      "Explain quantum physics",
      "Who is Elon Musk?",
      "Fix this code: const x = 1;",
      "What's the best programming language to learn?",
      "Help me deploy my Docker container",
      "Write me a JavaScript function for sorting",
      "Who won the World Cup in 2022?",
      "What's the weather forecast for tomorrow?",
      "Tell me about the stock market today",
      "How do I create a React component?",
      "Write a SQL query to find users",
      "What's the best travel destination?",
      "Help me plan my wedding",
      "Explain the theory of relativity",
    ];

    cases.forEach((msg) => {
      it(`blocks: "${msg}"`, () => expectBlocked(msg));
    });
  });

  // ─── Group 7: Edge Cases — Should ALLOW ────────────────────

  describe("Edge cases: allowed (ambiguous but fitness-adjacent)", () => {
    it("allows single fitness keyword: 'weight'", () => expectAllowed("weight"));
    it("allows single fitness keyword: 'protein'", () => expectAllowed("protein"));
    it("allows: 'How do I gain weight?'", () => expectAllowed("How do I gain weight?"));
    it("allows: 'What supplements should I take?'", () => expectAllowed("What supplements should I take?"));
    it("allows: 'Can I work out with a cold?'", () => expectAllowed("Can I work out with a cold?"));
    it("allows: 'rest day'", () => expectAllowed("rest day"));
    it("allows: 'help'", () => expectAllowed("help"));
    it("allows: 'tips'", () => expectAllowed("tips"));
    it("allows ambiguous but harmless: 'hi'", () => expectAllowed("hi"));
    it("allows ambiguous but harmless: 'thanks'", () => expectAllowed("thanks"));
    it("allows food items for nutrition avoid input: 'peanuts'", () => expectAllowed("peanuts"));
    it("allows food items: 'gluten, dairy, shellfish'", () => expectAllowed("gluten, dairy, shellfish"));
    it("allows food items: 'soy, eggs, tree nuts'", () => expectAllowed("soy, eggs, tree nuts"));
    it("allows mixed fitness+food: 'avocado toast for breakfast before gym'", () => expectAllowed("avocado toast for breakfast before gym"));
  });

  // ─── Group 8: Edge Cases — Should BLOCK ────────────────────

  describe("Edge cases: blocked", () => {
    it("blocks empty string", () => expectBlocked(""));
    it("blocks whitespace only", () => expectBlocked("   "));
    it("blocks tab characters only", () => expectBlocked("\t\t"));
    it("blocks newlines only", () => expectBlocked("\n\n"));
    it("blocks: 'Write me a function to calculate BMI in Python'", () => {
      expectBlocked("Write me a function to calculate BMI in Python");
    });
    it("blocks sneaky off-topic: 'Write me a python script to track my calories'", () => {
      expectBlocked("Write me a python script to track my calories");
    });
    it("blocks sneaky off-topic: 'Can you write a javascript function to calculate bmr?'", () => {
      expectBlocked("Can you write a javascript function to calculate bmr?");
    });
    it("blocks sneaky off-topic: 'Who was the president when the gym was invented?'", () => {
      expectBlocked("Who was the president when the gym was invented?");
    });
    it("blocks sneaky off-topic: 'Can you explain the history of peanut allergy political laws?'", () => {
      expectBlocked("Can you explain the history of peanut allergy political laws?");
    });
    it("blocks sneaky off-topic: 'Tell me about the stock price of Apple fitness'", () => {
      expectBlocked("Tell me about the stock price of Apple fitness");
    });
    it("blocks sneaky off-topic: 'Help me compile a React app that lists exercises'", () => {
      expectBlocked("Help me compile a React app that lists exercises");
    });
    it("blocks sneaky off-topic: 'Write an essay about the benefits of deadlifting'", () => {
      expectBlocked("Write an essay about the benefits of deadlifting");
    });
    it("blocks sneaky off-topic: 'How do I invest in fitness stocks?'", () => {
      expectBlocked("How do I invest in fitness stocks?");
    });
    it("blocks: 'Can you write me a poem?'", () => expectBlocked("Can you write me a poem?"));
    it("blocks: 'Tell me about cryptocurrency trading'", () => expectBlocked("Tell me about cryptocurrency trading"));
    it("blocks: 'Help me with my college assignment'", () => expectBlocked("Help me with my college assignment"));
  });

  // ─── Group 9: Return Shape Validation ──────────────────────

  describe("Return shape validation", () => {
    it("returns an object with allowed and reason properties", () => {
      const result = checkTopicRelevance("test");
      expect(result).toHaveProperty("allowed");
      expect(result).toHaveProperty("reason");
      expect(typeof result.allowed).toBe("boolean");
      expect(typeof result.reason).toBe("string");
    });

    it("returns empty reason string when allowed", () => {
      const result = checkTopicRelevance("How do I squat properly?");
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe("");
    });

    it("returns non-empty reason string when blocked", () => {
      const result = checkTopicRelevance("Write me a Python script");
      expect(result.allowed).toBe(false);
      expect(result.reason.length).toBeGreaterThan(0);
    });

    it("blocked reason for empty input differs from off-topic reason", () => {
      const emptyResult = checkTopicRelevance("");
      const offTopicResult = checkTopicRelevance("Tell me a joke");
      expect(emptyResult.reason).not.toBe(offTopicResult.reason);
    });
  });

  // ─── Group 10: Case Insensitivity ─────────────────────────

  describe("Case insensitivity", () => {
    it("allows uppercase: 'WORKOUT PLAN'", () => expectAllowed("WORKOUT PLAN"));
    it("allows mixed case: 'How Do I Deadlift?'", () => expectAllowed("How Do I Deadlift?"));
    it("blocks uppercase off-topic: 'WRITE ME A PYTHON SCRIPT'", () => expectBlocked("WRITE ME A PYTHON SCRIPT"));
    it("blocks mixed case off-topic: 'Tell Me A Joke'", () => expectBlocked("Tell Me A Joke"));
  });
});
