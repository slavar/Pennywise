# Remediation Plan

## Build/Test Health
- TypeScript paths: Map `@/` to repo root.
```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "types": ["vitest/globals", "node"] // replace "jest"
  }
}
```
- Vitest: Already `globals: true`; ensure tests import nothing Jest‑only. Run: `npx tsc --noEmit` then `npm test`.

## Runtime Bugs
- yahoo-finance2: Use module functions, not `new`.
```ts
// pages/api/portfolio*.ts
import yahooFinance from 'yahoo-finance2';
const data = await yahooFinance.historical(ticker, { period1, period2, interval: '1d' });
```
- Clerk client: Use object, not callable.
```ts
import { clerkClient } from '@clerk/nextjs/server';
const user = await clerkClient.users.getUser(userId);
```
- Head scripts duplication: Do not render `CustomHead` in `app/layout.tsx`. Keep `app/head.tsx` or migrate GA to `next/script` there.

## Security & Configuration
- Error responses: Avoid leaking internal messages.
```ts
catch (e) {
  console.error(e);
  return res.status(500).json({ error: 'Internal server error' });
}
```
- OpenAI key: Fail fast with 400 and guard payload size.
```ts
if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: 'Missing configuration' });
if ((text?.length ?? 0) > 20_000) return res.status(413).json({ error: 'Input too large' });
```
- Mongo URI import crash: Move `throw` into a getter or init function used inside handlers; keep tests using `vitest.global.setup` env.

## Docs & Config Mismatches
- Node versions: Align engines with README and `.nvmrc`.
```json
// package.json
"engines": { "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0" }
```
- Tailwind: Either re‑add Tailwind config or update README/AGENTS.md to remove Tailwind guidance if not used.

## Repository Hygiene
- Ignore build/test artifacts and keep lockfile tracked.
```gitignore
# .gitignore
.tsbuildinfo
test-results/
- package-lock.json
```
- Remove committed artifacts: `git rm -r --cached tsconfig.tsbuildinfo test-results`.
- Clean `.vscode/launch.json`: Remove duplicates and the Node launch of `app/page.tsx`.

## Frontend/UX
- GA scripts: Use `next/script` inside `app/head.tsx` and ensure single insertion.
- Public routes with Clerk middleware: Ensure unauth endpoints remain public.
```ts
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware({
  publicRoutes: ['/', '/learn', '/api/portfolio']
});
```

## Validation
- Run locally: `nvm use && npm install && npx tsc --noEmit && npm test && npm run build`.
