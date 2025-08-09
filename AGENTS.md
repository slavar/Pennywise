# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and layouts (e.g., `app/page.tsx`, `app/layout.tsx`).
- `pages/api/`: API routes exporting a default handler (e.g., `pages/api/portfolio.ts`).
- `lib/`: Server utilities and data helpers (e.g., `lib/mongodb.ts`, `lib/portfolio.ts`).
- `__tests__/`: Vitest unit and integration tests (`__tests__/app`, `__tests__/api`).
- `public/`: Static assets. `styles/`: Tailwind global styles.

## Build, Test, and Development Commands
- `nvm use`: Select Node from `.nvmrc` (Node 22.x preferred; 18.14/20/22/24 supported).
- `npm run dev`: Start the dev server at `http://localhost:3000`.
- `npm run build`: Create a production build.
- `npm start`: Run the production server locally.
- `npm test`: Run all Vitest tests. Example to focus: `npx vitest run __tests__/app/Foo.test.tsx`.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode; 2‑space indentation; prefer functional React components.
- Filenames: Components `PascalCase.tsx`; utilities `camelCase.ts`; API routes `pages/api/<name>.ts`.
- Styling: Global CSS in `styles/global.css` with CSS variables; keep utility classes simple and avoid framework‑specific CSS unless reintroduced.
- Patterns: Follow existing module boundaries under `lib/` and avoid unnecessary abstractions.

## Testing Guidelines
- Frameworks: Vitest + Testing Library (`jsdom`). Keep tests deterministic and fast.
- Locations: Component tests in `__tests__/app/*.test.tsx`; API tests in `__tests__/api/*.integration.test.ts`.
- Data: API tests may use in‑memory MongoDB where applicable.
- Run: `npm test` for all; focus specific files with `npx vitest run <path>`.

## Commit & Pull Request Guidelines
- Commits: Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`). Keep messages imperative and scoped.
- PRs: Provide a clear description, linked issues, test plan (commands + expected result), and screenshots for UI changes.
- CI hygiene: Ensure `npm test` passes and `npm run build` succeeds; avoid noisy diffs and unrelated refactors.

## Security & Configuration
- Do not commit secrets. Use `.env.local` for `MONGODB_URI`, analytics, etc.
- Validate inputs on API routes; avoid leaking stack traces to clients.
- Node versions: v18.14.0, v20.x, v22.x, or v24.x (default via `.nvmrc`).

## API Endpoints
- `GET /api/portfolio`: Query `tickers` (comma-separated; default `BND,VOO,AAPL`) and `years` (default `5`). Returns `{ series }` where `series` is an array like:
  ```json
  {
    "series": [
      { "symbol": "VOO", "points": [ { "date": "2023-01-01T00:00:00.000Z", "close": 377.45 } ] }
    ]
  }
  ```
- Notes: Uses Yahoo Finance `chart(range, interval)`; UI computes aggregate performance from this data using `lib/portfolio.getPortfolio`.
