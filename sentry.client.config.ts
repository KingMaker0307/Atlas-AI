/**
 * Sentry Configuration — Next.js Client
 *
 * Setup:
 *   1. Run: npx @sentry/wizard@latest -i nextjs
 *   2. Add NEXT_PUBLIC_SENTRY_DSN to .env
 *   3. Uncomment the init() call below
 *
 * Free tier: 5,000 errors/month + performance tracing
 */

// import * as Sentry from "@sentry/nextjs";
//
// Sentry.init({
//   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
//   environment: process.env.NODE_ENV,
//   tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
//   // Session replay — records screen on crash (useful for UX bugs)
//   replaysOnErrorSampleRate: 1.0,
//   replaysSessionSampleRate: 0.05,
//   integrations: [
//     Sentry.replayIntegration(),
//   ],
//   // Don't log in development (too noisy)
//   beforeSend(event) {
//     if (process.env.NODE_ENV === "development") return null;
//     return event;
//   },
// });

export {};
