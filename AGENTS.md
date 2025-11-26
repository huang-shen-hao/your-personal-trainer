# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the Vue 3 + Vite + TypeScript app: `views/` (pages), `components/` (reusable UI with Element Plus), `layouts/` (shells), `router/` (routes), `stores/` (Pinia state), `services/` (API helpers), `db/` (Dexie schema), `utils/` (shared helpers), `styles/` + `theme/` (global SCSS tokens), and `assets/` (media).
- `data/` and `prompts/` hold seed content and AI prompt templates; keep them in sync with UI changes.
- `docs/` stores PRDs and design notes (e.g., `theme-guide.md`); update when flows or styles change.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node 18+ recommended).
- `npm run dev` — start Vite dev server on port 5173 (auto-opens in browser).
- `npm run build` — type-check with `vue-tsc` then produce `dist/`.
- `npm run preview` — serve the built bundle for smoke testing.
- `npm run lint` — ESLint for Vue/TS/JS with auto-fix; respects `.gitignore`.
- `npm run format` — Prettier formatting for `src/`.

## Coding Style & Naming Conventions
- Prefer `<script setup lang="ts">` and Composition API; component files use PascalCase (e.g., `PlanCard.vue`).
- Use the `@` alias for `src/` imports to avoid deep relative paths.
- SCSS is available; reuse variables/tokens from `src/theme` and globals in `src/styles`.
- Let Prettier/ESLint enforce formatting (2-space indent, single quotes, trailing commas per config). Keep Pinia stores typed (`useXStore` pattern) and colocate shared utilities in `utils/`.

## Testing Guidelines
- No automated tests are wired up yet; when adding business logic, add Vitest + Vue Testing Library (or your chosen Vue test stack) and place specs alongside sources (`Component.spec.ts` or `__tests__` folders).
- Until tests exist, gate merges with `npm run lint` and `npm run build`; use `npm run preview` for manual smoke tests of critical flows.

## Commit & Pull Request Guidelines
- Use imperative, scoped commit subjects; Conventional Commit prefixes (`feat`, `fix`, `chore`, `refactor`, `docs`) keep history readable (e.g., `feat: add workout progress charts`).
- PRs should summarize intent, list key changes, call out risk areas, and include screenshots or clips for UI tweaks. Note data schema changes (IndexedDB/Dexie) and commands run.
- Never commit secrets or user data; keep API keys in local `.env` files and document required env vars in the PR or `docs/`.
