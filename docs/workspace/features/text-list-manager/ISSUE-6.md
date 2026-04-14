## ISSUE-6: apps/react-app — Project Scaffolding

**Feature**: text-list-manager
**Type**: chore
**Scope**: apps/react-app
**Priority**: P0
**Depends on**: ISSUE-4

### Description
Scaffold the `react-app` workspace package: Vite + React 18 + TypeScript + Vitest + Playwright. No application logic yet — only the project structure, config files, and a working dev server shell.

**Directory structure after this issue:**
```
apps/react-app/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── index.html
├── src/
│   └── main.tsx          # minimal bootstrap (renders <div id="app">)
└── e2e/                  # empty, Playwright tests added in ISSUE-10
```

**`apps/react-app/package.json`:**
```json
{
  "name": "react-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "@repo/core": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

**`apps/react-app/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "noEmit": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**`apps/react-app/tsconfig.node.json`** (for Vite config):
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**`apps/react-app/vite.config.ts`:**
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

**`apps/react-app/vitest.config.ts`:**
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

**`apps/react-app/src/test-setup.ts`:**
```ts
import '@testing-library/jest-dom';
```

Add `@testing-library/jest-dom` to devDependencies:
```json
"@testing-library/jest-dom": "^6.4.0"
```

**`apps/react-app/playwright.config.ts`:**
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**`apps/react-app/index.html`:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Text List Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`apps/react-app/src/main.tsx`** (minimal, to be replaced in ISSUE-8):
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>React App — coming soon</div>
  </StrictMode>
);
```

### Acceptance Criteria
- [x] `apps/react-app/package.json` exists with `@repo/core: "workspace:*"` dependency
- [x] `apps/react-app/tsconfig.json` extends `../../tsconfig.base.json` with `jsx: "react-jsx"`
- [x] `apps/react-app/vite.config.ts` and `vitest.config.ts` exist
- [x] `apps/react-app/playwright.config.ts` exists pointing to `./e2e` testDir
- [x] `pnpm install` at repo root resolves `@repo/core` correctly
- [x] `pnpm --filter react-app dev` starts a dev server on port 5173
- [x] `pnpm --filter react-app build` compiles TypeScript + Vite without errors (after `pnpm --filter @repo/core build`)
- [x] `pnpm --filter react-app test` runs (zero tests initially, but Vitest starts without error)

### Test Cases
No tests for this issue — it is scaffolding only. Verification is `pnpm dev` serving the placeholder page.

### Files Likely Affected
- `apps/react-app/package.json`
- `apps/react-app/tsconfig.json`
- `apps/react-app/tsconfig.node.json`
- `apps/react-app/vite.config.ts`
- `apps/react-app/vitest.config.ts`
- `apps/react-app/src/test-setup.ts`
- `apps/react-app/playwright.config.ts`
- `apps/react-app/index.html`
- `apps/react-app/src/main.tsx`

### Context & Constraints
- `@repo/core` must be built (ISSUE-4) before this app can resolve its imports. In CI, run `pnpm --filter @repo/core build` first.
- Vitest is configured separately from Vite (separate config file) to keep test environment settings isolated.
- `@testing-library/jest-dom` adds custom matchers (`toBeInTheDocument`, etc.) — the `test-setup.ts` import must run before every test file.
- Playwright's `webServer` option auto-starts the Vite dev server when tests run — no separate `pnpm dev` needed for E2E.
- ESLint config for this package will extend the root `.eslintrc.cjs` — no separate `.eslintrc.cjs` needed unless React-specific rules are added.
