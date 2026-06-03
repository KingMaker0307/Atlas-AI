# Atlas AI — Production-Readiness Quality Checklist

This checklist defines standard rules and verification items for each screen in the Atlas AI application. All agents MUST consult, verify, and check off this list when building, refactoring, or updating components.

---

## 1. Global Shell & UX Guidelines

- [ ] **Touch Target Size**: Interactive components (buttons, links, select menus, input tags) must have a minimum tap area of `40px` (preferably `44px` on mobile screens).
- [ ] **Safe Area & Notch**: Ensure screen content does not clip behind the status bar or notch. Use tailwind utility class padding `pt-[env(safe-area-inset-top)]` and bottom navigation padding `pb-[env(safe-area-inset-bottom)]`.
- [ ] **Viewport Responsiveness**: Check all screens on narrow viewports (e.g. `320px` to `375px` width) for text overflow, clipping, or unwanted horizontal scrolling. Flex layouts must use `flex-wrap` and grids must use responsive cols (e.g. `grid-cols-1 sm:grid-cols-2`).
- [ ] **Aesthetics & Theme Consistency**: Prevent color flashes, flickering, or low-contrast text in either Light or Dark mode. Colors must be pulled from standard Tailwind design tokens or HSL CSS variables in `variables.css`.
- [ ] **Keyboard Accessibility (a11y)**:
  - All interactive buttons must have a focus state (`focus-visible:ring-2 focus-visible:ring-emerald-400`).
  - Icon-only buttons must have `aria-label` or `title` tags for screen readers.
  - Interactive elements must be navigable via the Tab key.
- [ ] **Loading & Transition Feedback**: All async actions (AI requests, connection testing, data syncs) must display an active loading state (e.g. spinners, disabled triggers, or skeleton loaders).

---

## 2. Screen-by-Screen Quality Checklist

### [1] Welcome Screen (`welcome-screen.tsx`)
- [ ] Authentication tabs (Sign In / Sign Up) toggle cleanly without visual layout shifts.
- [ ] Federated Auth (Google/Apple login buttons) shows a loading spinner overlay once clicked to prevent double-submits.
- [ ] Email OTP format is validated using regex before sending API request.
- [ ] Simulated sandboxed OTP fallback is displayed cleanly if external mail service is unreachable.
- [ ] Suspended accounts display the "Access Denied" blocker layout with the correct styling.

### [2] Onboarding Screen (`onboarding.tsx`)
- [ ] Onboarding is structured as exactly 3 distinct, non-overlapping steps.
- [ ] Height and Weight inputs only accept positive numbers within reasonable boundaries.
- [ ] Goal selectors default to standard baselines.
- [ ] Upon onboarding completion, the user profile is stored locally, and the AI setup modal triggers immediately as a first-login popup.

### [3] Today Screen (Home / Habits Dashboard - `today-screen.tsx`)
- [ ] Daily habit items (Check-in, Workout, Nutrition & Hydration) update instantly when goals are updated or logged.
- [ ] Water Tracker logs inputs immediately and updates the radial visual progress ring correctly.
- [ ] Daily tip panel fetches from local `public/daily-tips.json` over remote GitHub fallbacks, with generic protein tips fallback.
- [ ] The AI Setup CTA card is displayed prominently above the daily tips until an active provider is saved in Settings.

### [4] Workout Screen (`workout-screen.tsx`)
- [ ] Active workout session displays a persistent timer showing sets completed.
- [ ] Input fields (reps, weight) prevent negative values and validate input bounds.
- [ ] Rest timer offers standard audio alarms and stop triggers.
- [ ] Voice logging command button displays active recording states, parsing quantities correctly.
- [ ] Active workouts exceeding the maximum 3-hour limit are automatically force-stopped by the system check loop.
- [ ] Offline local changes are queued immediately in the Composite Sync Queue.

### [5] Workout Plan Detail Screen (`workout-plan-detail.tsx`)
- [ ] Displays plan name, target muscles list, and goal description clearly.
- [ ] Daily workout limit (max 3 logged per day) is guarded and displays explanatory tooltip using the touch-friendly `<Tooltip>` component.
- [ ] If the last workout was force-stopped by the system limit, a rose-colored warning banner is displayed at the top.
- [ ] Beginner Mode vs Advanced Mode toggles details (shows/hides historical volume charts).

### [6] Workout Plan Builder Screen (`workout-plan-builder.tsx`)
- [ ] AI prompt integrates goals and physique selections in generating plans.
- [ ] Routine Day Conflict modal pops up if the user schedules multiple routines on the same day.
- [ ] Custom exercise creation validates fields and prevents duplicate exercise names.

### [7] Nutrition Tracker (Add Food Modal - `nutrition-tracker.tsx`)
- [ ] Spacings are compact (`p-3.5` and `space-y-3`) to prevent vertical layout overflows on mobile viewports.
- [ ] Meal slot selector is formatted as an inline horizontal flex row.
- [ ] Attachment camera icon sits inline inside the description box, displaying uploaded thumbnails as small `h-10 w-10` previews.
- [ ] Macro input fields are formatted as a 2-column grid. Stepper buttons (`+`/`-`) increment values by `0.5` steps.
- [ ] Collapsible advanced nutrients list displays RDA progress without causing viewport clipping.

### [8] Nutrition Analytics Screen (`nutrition-analytics-screen.tsx`)
- [ ] Content cards render in the correct order:
  1. Caloric Budget & Baselines (top)
  2. Today's Macronutrient Progress (middle)
  3. Historical Trends & Averages (bottom)
- [ ] Advanced Mode (`!guidedMode`) nests the Vitamin & Mineral RDA progress list under today's progress card.
- [ ] Advanced Mode nests top source foods under historical trends card.
- [ ] Experience Mode toggle button is styled as a single toggle button with the `Activity` status icon.

### [9] Coach Screen (`coach-screen.tsx`)
- [ ] Private AI Trainer chat messages persist in local IndexedDB.
- [ ] AI chat responses stream smoothly without causing scrolling jumps.
- [ ] Presets starter question chips submit immediately on tap.

### [10] Settings Screen (`settings-screen.tsx`)
- [ ] Settings tabs (Profile, Goals, AI Setup, Backups, System) navigate smoothly.
- [ ] App theme options (Light, Dark, System) coordinate correctly with system-level preferences.
- [ ] Experience Mode is configured as a single toggle button styled matching the Nutrition Analytics page toggle.
- [ ] Form hints (Base URL, API Key, Model) use custom `<Tooltip>` touch-friendly popovers instead of HTML `title` attributes.
- [ ] Connection test buttons display loading spinner states.
- [ ] System tab diagnostics show local SQLite/IndexedDB queue sizes and provide data wipe/restore buttons.
