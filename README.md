# Atlas AI Coach

This is a production-oriented, local-first PWA fitness tracker built with Next.js, React, and TypeScript.

## Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS
- **State Management**: Zustand (with optimistic updates)
- **Storage**: IndexedDB (local-first)
- **Security**: Web Crypto AES-GCM for encrypted keys

## Features

- Local-first data storage (no cloud backend)
- User profile with biometric data (age, height, weight, etc.)
- Workout tracking
- AI-powered coach (coming soon)
- PWA support for offline access

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

## Biometric Data Update

We've recently updated the `UserProfile` domain type and IndexedDB seed data to include the following biometric fields:

- `age`
- `height`
- `weight`
- `targetPhysique`
- `dietaryPreferences`

This change was made to bypass complex onboarding forms and fix an iOS Safari hydration race condition. The new fields are now displayed on the settings screen.
