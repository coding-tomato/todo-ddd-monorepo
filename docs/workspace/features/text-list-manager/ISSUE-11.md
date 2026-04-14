## ISSUE-11: apps/vanilla-app — Project Scaffolding

**Feature**: text-list-manager
**Type**: chore
**Scope**: apps/vanilla-app
**Priority**: P0
**Depends on**: ISSUE-4

### Description
Scaffold the `vanilla-app` workspace package: Vite (vanilla JS, no framework) + Vitest + Playwright. No application logic yet — only project structure, config files, and a working dev server shell.

**Directory structure after this issue:**
```
apps/vanilla-app/
├── package.json
├── vite.config.js
├── vitest.config.js
├── playwright.config.js
├── index.html
├── src/
│   └── main.js           # minimal bootstrap placeholder
└── e2e/                  # empty, Playwright tests added in ISSUE-14
```

**`apps/vanilla-app/package.json`:**
```json
{
  "name": "vanilla-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@repo/core": "workspace:*"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "jsdom": "^24.0.0",
    "vite": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

Note: No TypeScript in vanilla-app. All JS files use plain ES modules (`.js`).

**`apps/vanilla-app/vite.config.js`:**
```js
import { defineConfig } from 'vite';

export default defineConfig({});
```

**`apps/vanilla-app/vitest.config.js`:**
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

**`apps/vanilla-app/playwright.config.js`:**
```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5174', // different port from react-app (5173)
  },
  webServer: {
    command: 'pnpm dev -- --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**`apps/vanilla-app/index.html`:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Text List Manager</title>
    <link rel="stylesheet" href="/src/styles/main.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

**`apps/vanilla-app/src/main.js`** (placeholder, replaced in ISSUE-12):
```js
document.querySelector('#app').innerHTML = '<p>Vanilla App — coming soon</p>';
```

### Acceptance Criteria
- [ ] `apps/vanilla-app/package.json` exists with `@repo/core: "workspace:*"` and correct scripts
- [ ] `apps/vanilla-app/vite.config.js`, `vitest.config.js`, `playwright.config.js` exist
- [ ] `apps/vanilla-app/index.html` has `<div id="app">` and module script entry
- [ ] `pnpm install` at repo root resolves `@repo/core` for this app
- [ ] `pnpm --filter vanilla-app dev` starts a dev server (default port 5173 or 5174 if react-app running)
- [ ] `pnpm --filter vanilla-app test` starts Vitest without error (zero tests initially)

### Test Cases
No automated tests for this issue — scaffolding only. Verification: `pnpm dev` serves the placeholder page.

### Files Likely Affected
- `apps/vanilla-app/package.json`
- `apps/vanilla-app/vite.config.js`
- `apps/vanilla-app/vitest.config.js`
- `apps/vanilla-app/playwright.config.js`
- `apps/vanilla-app/index.html`
- `apps/vanilla-app/src/main.js`

### Context & Constraints
- **No TypeScript** in vanilla-app — all source files are plain `.js`. Type safety is provided by JSDoc comments and the `.d.ts` declaration files emitted by `packages/core` build.
- Vanilla-app uses a **different Vite port** (5174) from react-app (5173) to allow both dev servers to run simultaneously.
- `@repo/core` is consumed as the compiled ESM output from `dist/` — vanilla JS can import it without any TS compilation step.
- `jsdom` environment is needed for component tests (ISSUE-14) which manipulate the DOM without a real browser.
- There is no `tsconfig.json` in this package — it is not a TypeScript project.
