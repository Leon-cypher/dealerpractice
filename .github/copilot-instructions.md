# Copilot Instructions

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Type-check (tsc) then Vite build → dist/
npm run lint      # ESLint on all .ts/.tsx files (zero warnings allowed)
npm run preview   # Preview production build locally

firebase deploy --only hosting    # Deploy to Firebase Hosting
firebase deploy --only firestore  # Deploy Firestore rules + indexes
```

There are no tests. No test runner is configured.

## Architecture

This is a single-page React 18 + TypeScript + Vite app — a poker dealer training platform (Leon-lab). The app is deployed to Firebase Hosting at `leon-lab-7066b.web.app`.

**Routing (react-router-dom v7):**
```
/ → HomePage (landing)
/game-menu → GameMenuPage (select game type, variant, mode)
/play → GamePlayPage (all game logic lives here)
/test-mode → TestModePage
/achievements → AchievementPage
```

**Global state — `GameContext` (`src/contexts/GameContext.tsx`):**
Holds `gameType` (`SPLIT_POT | SHOWDOWN | QUIZ | BLINDS`), `gameVariant` (`HOLDEM | OMAHA | BIGO`), and `gameMode` (`PRACTICE | CHALLENGE`). Navigation flow: user picks options in GameMenuPage → context is set → navigate to `/play`.

**Game components** (`src/components/`) are **pure presentational** (all accept props, use `React.memo`). All game state and logic lives in `GamePlayPage.tsx`.

**Utility modules** (`src/utils/`):
- `pokerLogic.ts` — deck creation, shuffle, hand evaluation (Hold'em / Omaha / BIGO)
- `potCalculator.ts` — all-in side-pot calculation and payout distribution
- `blindsLogic.ts` — blind structure and level calculations
- `quizData.ts` — 110 TDA rules questions (static data array)
- `quizLogic.ts` — question selection and scoring helpers
- `cn.ts` — Tailwind class merge utility (`clsx` + `tailwind-merge`)

**Firebase backend** (`src/firebase.ts`):
- Auth: Google OAuth via popup (Chrome/Edge) or redirect (Safari/Firefox). Config is hardcoded in `firebase.ts` (public project credentials).
- Firestore collections:
  - `profiles/{uid}` — `{ nickname, avatar_url, updated_at }`
  - `leaderboard/{entryId}` — `{ name, score, streak, type, user_id, avatar_url, created_at }`
- Storage: avatar image uploads

**Scoring formula:**
```
finalScore = 100 × (1 + streak × 0.2) × (answerTime < 10s ? 1.5 : 1.0) × difficultyMultiplier
// Difficulty: BIGO=2.0, OMAHA=1.5, QUIZ=1.2, HOLDEM=1.0
```

Only **CHALLENGE mode** scores (5-min countdown) qualify for leaderboard. Top 10 per category.

**Custom hooks** (`src/hooks/`):
- `useAuth` — Firebase Auth state + Firestore profile fetch
- `useGameAuth` — auth flow specifically for in-game sign-in triggers
- `useLeaderboard` — fetch/cache top-10 per `LeaderboardType`
- `useCountdown` — challenge mode 5-minute timer
- `useModal` — open/close state helper
- `useToast` — show/dismiss toast notifications
- `useGameScore` — shared scoring calculation and streak tracking
- `useSplitPotGame` — game logic for SPLIT_POT type
- `useShowdownGame` — game logic for SHOWDOWN type
- `useQuizGame` — game logic for QUIZ type
- `useBlindsGame` — game logic for BLINDS type
- `useExamGame` — game logic for exam/test mode

`GamePlayPage` selects the appropriate game hook based on `gameType` from `GameContext`.

## Key Conventions

**Styling:** Tailwind CSS with custom theme tokens:
- `brand-gold` (`#fbbf24`) — primary accent
- `brand-green` (`#0a2d1d`) — dark green background
- `poker.green` / `poker.gold` — secondary poker-themed colors
- `text-xxs` — extra-small font size (`0.65rem`)
- Always use `cn()` from `src/utils/cn.ts` for conditional/merged class names.

**Component pattern:** Presentational components receive all data and callbacks via props. No context access inside components — only pages and hooks touch context/Firebase.

**Firebase auth strategy:** Uses `signInWithPopup` first, falls back to `signInWithRedirect` for browsers that block popups (Safari, LINE in-app browser). The `getRedirectResult()` call in `GamePlayPage` handles the redirect flow on page load.

**Leaderboard types** match the `LeaderboardType` union in `useLeaderboard.ts`:
`SPLIT_POT | SHOWDOWN_HOLDEM | SHOWDOWN_OMAHA | SHOWDOWN_BIGO | QUIZ`

**`@supabase/supabase-js`** is listed as a dependency but is not used — it's a legacy remnant and should not be imported.

**`lab/` directory** and `npm run lab` (`vite lab`) are for local experiments — not part of the production build.
