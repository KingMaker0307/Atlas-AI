# Atlas AI Coach

Atlas AI Coach is a production-oriented, mobile-first PWA for local-first workout tracking and AI fitness coaching. It features a local-first offline architecture with automatic, secure cloud synchronization to a Supabase database backup, and lets users connect their own AI providers.

## Architecture Overview

- **Next.js 16 + React 19 + TypeScript** with full SSR support for server-side API endpoints, middleware route guards (`proxy.ts`), and strict security headers.
- **Local-first storage** uses IndexedDB for profiles, workouts, recovery logs, body metrics, AI messaging memory, and provider settings.
- **Hexagonal Architecture (Ports and Adapters)** organizes the codebase to cleanly isolate domain logic from external services and databases.
- **Encrypted secrets** use Web Crypto AES-GCM. API keys are encrypted before local persistence; profile backup exports are passphrase-protected.
- **AI provider layer** exposes a single interface supporting OpenAI, Claude, Gemini, Grok, DeepSeek, OpenRouter, Ollama, LM Studio, and custom OpenAI-compatible endpoints.
- **Progression engine** computes recovery score, weekly volume, estimated 1RM, PRs, training streaks, deload suggestions, and progressive overload recommendations.
- **PWA shell** includes manifest, install prompt, service worker caching, safe-area support, bottom navigation, and offline state.

---

## Folder Structure (Hexagonal Architecture)

The codebase strictly follows Hexagonal Architecture directories:

```text
src/
  ports/                   # PORTS: Boundary interfaces (e.g. UserRepository)
  adapters/                # ADAPTERS: Implementations of port interfaces
    indexeddb/             # Local database adapter implementing the repository ports
    supabase/              # Cloud database backup adapter implementing the repository ports
    composite/             # Sync cache coordinator (mediates local/remote writes)
  app/                     # Next.js page routing, API serverless endpoints, and global styles
  components/              # React screens, modal checkins, and Tailwind UI primitives
  data/                    # Static exercise database, onboarding plan templates, and seeds
  lib/
    ai/                    # Shared AI client interfaces and message parsers
    coach/                 # System prompt builders and offline mock responses
    progression/           # Progressive overload overload rules and streak engines
    security/              # Web Crypto AES-GCM wrappers for encryption
    storage/               # IndexedDB DB schema versioning, sync queue database tables
    repositories/          # Registry singleton acting as the dependency injection point
  providers/               # External AI API clients (Gemini, Claude, Ollama adapters)
  store/                   # Zustand global state divided into slice modules
  types/                   # Domain entities and types (e.g. Workout, UserProfile)
```

---

## Core System Design

The UI talks directly to a single Zustand store. The store hydrates from IndexedDB, performs optimistic updates, and writes snapshots back to IndexedDB after each action. 

Under the hood, all database interactions go through **Repository Ports** (`src/ports/repositories.ts`). The **Composite Adapter** wraps both local (IndexedDB) and remote (Supabase) repositories. Writes update IndexedDB immediately for instant offline reactivity and are pushed to Supabase asynchronously. If a write fails while offline, it is written to the IndexedDB `sync_queue` and replayed automatically on reconnect.

---

## Setup & Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root containing your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-admin-bypass-key
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

### Useful Verification Commands
```bash
npm run typecheck   # Run TypeScript compiler
npm run test        # Run Vitest unit tests (50 tests)
npm run build       # Build Next.js production bundle
```

---

## Deployment

### Node.js / Vercel / Docker
Deploy as a standard Next.js application. The application requires a server runtime to support Next.js middleware, security headers, and the profile synchronization endpoints.
