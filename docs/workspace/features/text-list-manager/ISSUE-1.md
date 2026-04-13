## ISSUE-1: Monorepo Scaffolding

**Feature**: text-list-manager
**Type**: chore
**Scope**: root
**Priority**: P0
**Depends on**: none

### Description
Set up the pnpm monorepo root. This creates the workspace configuration, shared tooling configs (TypeScript base, ESLint), and root-level package.json with aggregate scripts. No application code is written here — only the skeleton that all subsequent issues build on top of.

The monorepo layout must be:
```
/
├── packages/
│   └── core/                  # (empty, created by ISSUE-2)
├── apps/
│   ├── react-app/             # (empty, created by ISSUE-6)
│   └── vanilla-app/           # (empty, created by ISSUE-11)
├── pnpm-workspace.yaml
├── package.json               # root: scripts only, no deps
├── tsconfig.base.json         # shared TS base extended by packages
├── .eslintrc.cjs              # root ESLint config, extended per package
└── .gitignore
```

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Root `package.json`** (scripts only, no dependencies):
```json
{
  "name": "text-list-manager",
  "private": true,
  "scripts": {
    "build": "pnpm --filter @repo/core build && pnpm -r --filter !@repo/core build",
    "test": "pnpm -r test",
    "dev:react": "pnpm --filter react-app dev",
    "dev:vanilla": "pnpm --filter vanilla-app dev",
    "lint": "pnpm -r lint"
  }
}
```

**`tsconfig.base.json`** (shared across all TypeScript packages):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Root `.eslintrc.cjs`:**
```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
  rules: {},
};
```

**`.gitignore`:**
```
node_modules/
dist/
.pnpm-store/
*.local
```

### Acceptance Criteria
- [x] `pnpm-workspace.yaml` exists at repo root listing `packages/*` and `apps/*`
- [x] Root `package.json` has `name`, `private: true`, and the 5 scripts listed above — no `dependencies` or `devDependencies`
- [x] `tsconfig.base.json` exists with `strict: true` and the options listed above
- [x] Root `.eslintrc.cjs` exists
- [x] `.gitignore` covers `node_modules/`, `dist/`, `.pnpm-store/`, and `*.local`
- [x] `packages/` and `apps/` directories exist (may be empty)
- [ ] Running `pnpm install` at the root succeeds with zero packages (no deps yet)

### Test Cases
- No automated tests for this issue — it is pure configuration. Verification is manual: `pnpm install` must exit 0 at the repo root.

### Files Likely Affected
- `pnpm-workspace.yaml`
- `package.json`
- `tsconfig.base.json`
- `.eslintrc.cjs`
- `.gitignore`
- `packages/` (directory)
- `apps/` (directory)

### Context & Constraints
- Use **pnpm** (not npm or yarn). pnpm workspaces are declared in `pnpm-workspace.yaml`.
- The root `package.json` must have **no `dependencies` or `devDependencies`** — tooling deps live in the individual package/app manifests.
- TypeScript strict mode is non-negotiable for all TS packages.
- ESLint is configured at root and extended per package — do not put the full config inside individual packages yet; that happens in ISSUE-2 (core) and ISSUE-6 (react-app).
