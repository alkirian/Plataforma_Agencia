# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Node/Express API.
  - Entry: `src/index.js`. Routes in `src/api`, logic in `src/controllers`, `src/services`, middleware in `src/middleware`, helpers in `src/utils`.
  - Env: `backend/.env` (see `backend/.env.example`).
- `frontend/`: React (Vite).
  - Entry: `src/main.jsx`, `App.jsx`. Components in `src/components`, pages in `src/pages`, hooks in `src/hooks`, API calls in `src/api`, stores in `src/stores`, styles in `src/styles`.
  - Env: `frontend/.env.local` (see `frontend/.env.example`).
- `supabase/`: Local CLI metadata. Do not edit generated internals.
- Tests: Prefer colocated near sources: `**/*.test.{js,jsx}` or `**/*.spec.{js,jsx}`.

## Build, Test, and Development Commands
- Backend dev: `cd backend && npm install && npm run dev` — starts nodemon server.
- Backend prod: `cd backend && npm start` — runs `src/index.js`.
- Frontend dev: `cd frontend && npm install && npm run dev` — Vite on `5173`.
- Frontend build: `cd frontend && npm run build` — outputs to `frontend/dist/`.
- Frontend preview: `cd frontend && npm run preview` — serves built app.
- Tests: add `npm test` scripts before test‑heavy PRs.

## Coding Style & Naming Conventions
- ES Modules (`"type": "module"`), 2‑space indentation.
- React components in PascalCase; hooks start with `use*`.
- Backend files: `*.routes.js`, `*.controller.js`, `*.service.js`, `*.middleware.js`.
- Lint/format (frontend): ESLint + Prettier (`eslint.config.js`, `.prettierrc`). Keep imports sorted and remove unused code.

## Testing Guidelines
- Frameworks: Frontend — Vitest + React Testing Library; Backend — Jest + supertest.
- Coverage: target ≥80% lines for changed code.
- Naming: `**/*.test.{js,jsx}` or `**/*.spec.{js,jsx}` near sources.
- Tip: mock network and external services (e.g., Supabase) in tests.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat: ...`, `fix(ui): ...`, `chore(backend): ...`). Be specific.
- PRs: include purpose, linked issues, UI screenshots/GIFs (when applicable), manual test steps, and risk notes.
- Ensure builds pass, lint/format clean, no secrets in diffs, and docs updated when behavior changes.

## Security & Configuration Tips
- Never commit `.env*` files. Backend uses Supabase service keys; frontend uses anon keys in `.env.local`.
- Configure CORS in backend and validate inputs (`src/middleware`, `src/schemas`). Rotate keys if leaked.
- Avoid editing `supabase/` generated files unless explicitly required by the CLI.

