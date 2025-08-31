# Repository Guidelines

## Project Structure & Module Organization
- backend: Node/Express API. Key dirs: `src/api` (routes), `src/controllers`, `src/services`, `src/middleware`, `src/utils`; entry `src/index.js`. Env: `backend/.env` (see `.env.example`).
- frontend: React (Vite). Dirs: `src/components`, `src/pages`, `src/hooks`, `src/api`, `src/stores`, `src/styles`; entry `App.jsx`, `main.jsx`. Env: `frontend/.env.local` (see `.env.example`).
- supabase: Local CLI metadata. Do not edit generated internals.

## Build, Test, and Development Commands
- Backend dev: `cd backend && npm install && npm run dev` — nodemon server.
- Backend prod: `cd backend && npm start` — runs `src/index.js`.
- Frontend dev: `cd frontend && npm install && npm run dev` — Vite on `5173`.
- Frontend build: `cd frontend && npm run build` — outputs to `frontend/dist/`.
- Frontend preview: `cd frontend && npm run preview` — serves built app.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; ES Modules (`type: module`).
- React: Components in PascalCase (e.g., `ClientCard.jsx`); hooks start with `use*`.
- Backend files: `*.routes.js`, `*.controller.js`, `*.service.js`, `*.middleware.js`.
- Lint/format (frontend): ESLint + Prettier (`eslint.config.js`, `.prettierrc`). Keep imports sorted and remove unused code.

## Testing Guidelines
- Status: No runners configured yet. Prefer Vitest + RTL (frontend) and Jest + supertest (backend).
- Naming: `**/*.test.{js,jsx}` or `**/*.spec.{js,jsx}` near sources (e.g., `src/components/Button.test.jsx`).
- Coverage: Target ≥80% lines for changed code. Add `npm test` scripts before test‑heavy PRs.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat: ...`, `fix(ui): ...`, `chore(backend): ...`). Be specific; English or Spanish allowed.
- PRs: Include purpose, linked issues, screenshots/GIFs for UI, manual test steps, and risk notes. Ensure builds pass, lint/format clean, no secrets, and docs updated when behavior changes.

## Security & Configuration Tips
- Never commit `.env*` files. Backend uses Supabase service keys; frontend uses anon keys in `.env.local`.
- Configure CORS in backend and validate inputs (`src/middleware`, `src/schemas`). Rotate keys if leaked.
