<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Architecture & Agent Guidelines

## 1. Architectural Guardrails (Hexagonal Architecture)
- **Ports & Adapters separation**: Keep core domains/entities and interfaces (Ports) completely decoupled from external services (Adapters).
- **Dependency Injection**: Use the registry (`src/lib/repositories/registry.ts`) to dynamically resolve/inject adapters. Never import specific databases, storage mechanisms, or API clients directly into components or application stores.
- **Location of Adapters**: Local state/IndexedDB implementations go in `src/adapters/indexeddb/` and network sync clients go in their respective adapters.

## 2. Directory Structure Cleanliness & Junior Dev Readability
- Keep the repository 100% clean and free of dead or unused files, hooks, directories, or leftover mocks.
- Ensure all files and folders are structured and named clearly so that even a junior developer can instantly understand the architecture and work with files without confusion.
- Always check the current structure carefully before creating or moving files.

## 3. Strict Verification & Unit Testing
- Every core utility, helper, and domain logic file must have robust unit tests (e.g., `*.test.ts` using Vitest).
- After any architectural shift, directory change, or refactoring:
  1. Run unit tests (`npm run test`) to verify all assertions pass.
  2. Run type checking (`npm run typecheck`) to confirm 100% type-safety.
  3. Run the Next.js build (`npm run build`) to ensure the application compiles cleanly.

## 4. Change Management & Communication
- **Analysis first**: Carefully analyze the existing structure before making modifications.
- **Inform on breaking changes**: If a proposed change has the potential to break existing integrations, routes, configurations, or interfaces, you **MUST** inform the user and obtain approval before execution.

## 5. UI/UX, Typography & Theme Integrity
- **Maintain Typography & Design Tokens**: Strictly follow the project's established fonts, typography hierarchies, and spacing variables defined in CSS modules or utility classes. Do not introduce ad-hoc font families or sizes.
- **System and App Theme Coordination**: Ensure that user-selected theme settings (e.g. Light/Dark mode) integrate seamlessly with system-level theme preferences. Always prevent theme conflicts, flickering, or unreadable high-contrast issues during client-side hydration.
- **No Unsolicited UI Changes**: Never modify workscreens, pages, layouts, or component UI files for visual or layout changes unless explicitly requested by the user and confirmed with a clear message beforehand.
- **Responsive Layout & Device Adaptation**: Always design, create, and update components considering all device screen sizes, from mobile (especially iOS/Android viewports, handling safe area insets and notches) to laptops and desktops. All screens must scale and fit without clipping, text overflow, layout breaks, or unwanted scrolling issues.
