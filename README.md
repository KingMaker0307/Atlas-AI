# Atlas AI Coach

Atlas AI Coach is a production-oriented, mobile-first PWA for local-first workout tracking and AI fitness coaching. It runs without a backend, stores user data on the device, and lets users connect their own AI providers or use the built-in mock coach offline.

## Architecture overview

- **Next.js 16 + React 19 + TypeScript** with static export support for Vercel, GitHub Pages, or any static host.
- **Local-first storage** uses IndexedDB for profile, workouts, recovery, body metrics, AI memory, routines, and provider settings.
- **Encrypted secrets** use Web Crypto AES-GCM. API keys are encrypted before local persistence; encrypted JSON exports are passphrase protected.
- **AI provider layer** exposes one interface for OpenAI, Claude, Gemini, Grok, DeepSeek, OpenRouter, Ollama, LM Studio, and custom OpenAI-compatible endpoints.
- **Progression engine** computes recovery score, weekly volume, estimated 1RM, PRs, stalls, deload suggestions, and overload recommendations.
- **PWA shell** includes manifest, install prompt, service worker caching, safe-area support, bottom navigation, and offline state.

## Folder structure

```text
src/
  app/                     Next app entry, metadata, global CSS
  components/              PWA shell, UI primitives, screens, onboarding
  data/                    Exercise database, routines, seed data
  lib/
    ai/                    Shared provider interfaces
    coach/                 Coach context and offline mock responses
    progression/           Rule-based coaching engine
    security/              Local encryption and encrypted export
    storage/               IndexedDB and localStorage abstraction
  providers/               Provider adapters
  store/                   Zustand app state and actions
  types/                   Domain types
public/
  manifest.webmanifest
  sw.js
  icons/
```

## Core system design

The UI talks to a single Zustand store. The store hydrates from IndexedDB, performs optimistic updates, and saves snapshots back to IndexedDB after each important action. Provider keys are never placed in remote config or environment variables; users add them in Settings, where they are encrypted locally.

AI calls are optional. If no provider is connected, the coach builds the same local training context and returns a deterministic mock coaching response. Local endpoints such as Ollama and LM Studio can run without API keys.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Deployment

### Vercel

Deploy normally. The app has no backend requirement and exports statically.

### GitHub Pages

Set `NEXT_PUBLIC_BASE_PATH` to your repository path, then build:

```bash
NEXT_PUBLIC_BASE_PATH=/your-repo-name npm run build
```

Publish the generated `out/` directory.

## Notes

- Browser-to-provider requests may depend on each provider’s CORS rules. OpenRouter and localhost OpenAI-compatible servers are typically friendlier for direct browser use.
- The app includes future extension points for wearable integrations, optional cloud sync, Apple Health, Google Fit, voice logging, generated routines, image analysis, and barcode scanning.
- No telemetry, analytics, or forced accounts are included.
