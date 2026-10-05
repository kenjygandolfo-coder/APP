# FitApp — Project Memory

Cross-platform fitness app (Web + Android + iOS) from ONE TypeScript codebase.

## Stack
- Expo (React Native + React Native Web) + Expo Router, TypeScript strict
- zod for input validation
- Jest (jest-expo) + React Native Testing Library for unit/integration tests
- Playwright for E2E (web build)
- Supabase (Postgres + Auth + RLS) — planned for Module 2

## Commands
| Task | Command |
|---|---|
| Run web / android / ios | `npm run web` / `npm run android` / `npm run ios` |
| Unit tests / coverage | `npm test` / `npm run test:coverage` |
| Lint / types | `npm run lint` / `npm run typecheck` |
| Web build / E2E | `npm run build:web` / `npm run test:e2e` |

## Structure
- `app/` routes only (thin; no business logic)
- `src/features/<feature>/` everything for a feature (UI, domain, tests)
- `src/features/<feature>/domain/` pure logic, NO React imports
- `src/theme/` design tokens — never hardcode colors/sizes in components

## Rules (non-negotiable)
1. TDD: failing test first → minimal code → refactor. Coverage ≥ 80 % (enforced by Jest).
2. Immutability: never mutate; return new objects; freeze exported constants.
3. Small files (200–400 lines, 800 max), functions < 50 lines, nesting ≤ 4.
4. No `console.log` (ESLint `no-console: error`).
5. Validate every external input with zod. Errors must not echo user data or secrets.
6. Secrets only via `.env` (`EXPO_PUBLIC_*` = public values only). `.env` is gitignored.
7. Conventional commits: `feat|fix|refactor|docs|test|chore|perf|ci: description`.
8. Data access (Module 2+) goes through the `Repository<T>` interface and returns `ApiResponse<T>`.

## Domain facts
Revised Harris-Benedict (Roza & Shizgal, 1984) — NOT the 1919 original:
- Men:   BMR = 88.362 + 13.397·kg + 4.799·cm − 5.677·age
- Women: BMR = 447.593 + 9.247·kg + 3.098·cm − 4.330·age
- TDEE = BMR × {sedentary 1.2, light 1.375, moderate 1.55, veryActive 1.725, extraActive 1.9}
Implementation: `src/features/energy/domain/energyCalculator.ts`.

## Roadmap
- Module 1 (done): scaffold, structure, CI/CD, welcome screen, BMR/TDEE service
- Module 2: Supabase auth + profile; calculator UI consuming the energy service
