## ISSUE-4: packages/core — Infrastructure, Public API, and Build

**Feature**: text-list-manager
**Type**: feat
**Scope**: packages/core/src/infrastructure + build
**Priority**: P0
**Depends on**: ISSUE-3

### Description
Three things completed in this issue:

1. **`LocalStorageListRepository`** — the `ListRepository` implementation backed by `localStorage`. Shared by both apps because both target the same browser environment.

2. **`src/index.ts`** — the package's single public API surface. Explicitly re-exports only what consumers should import from `@repo/core`. This is the compiled entry point that `tsup` resolves.

3. **Build config** — `tsup` configured to emit ESM + CJS + `.d.ts`. After this issue, `pnpm --filter @repo/core build` must produce a working `dist/`.

---

**`LocalStorageListRepository`** (`src/infrastructure/LocalStorageListRepository.ts`):
```ts
import type { TextList } from '../domain/TextList';
import type { ListRepository } from '../domain/repositories/ListRepository';

const STORAGE_KEY = 'text-list-manager';

export class LocalStorageListRepository implements ListRepository {
  save(list: TextList): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.getItems()));
    } catch {
      // swallow quota / security errors — app remains functional
    }
  }

  load(): TextList | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const items = JSON.parse(raw);
      // reconstruct TextList from persisted items
      const list = new TextList();
      // use internal restoration to rebuild without re-validating text
      items.forEach((item: ListItem, index: number) => list.restoreItem(item, index));
      return list;
    } catch {
      return null; // corrupted JSON → treat as empty
    }
  }
}
```

**Note on `load()` reconstruction:** `TextList.addItem()` validates and generates new IDs — it cannot be used to reload persisted items. Use `restoreItem()` (the undo-restore method) to re-insert items at their positions without validation, preserving original IDs.

---

**`src/index.ts`** — public API, must export exactly:
- `TextList` (class)
- `ListItem` (interface/type)
- `ItemId` (type)
- `createItemId` (function)
- `ListRepository` (interface/type)
- `Command` (interface/type)
- `CommandHistory` (class)
- `AddItemCommand` (class)
- `DeleteSelectedCommand` (class)
- `DeleteByIdCommand` (class)
- `loadList` (function)
- `LocalStorageListRepository` (class)

---

**`tsup.config.ts`** at `packages/core/tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});
```

**Updated `packages/core/package.json`** (add build script + exports + tsup devDep):
```json
{
  "name": "@repo/core",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  }
}
```

### Acceptance Criteria
- [x] `LocalStorageListRepository` implements `ListRepository` interface
- [x] `LocalStorageListRepository.save()` calls `localStorage.setItem` and swallows quota/security errors
- [x] `LocalStorageListRepository.load()` returns `null` on missing key or JSON parse failure
- [x] `LocalStorageListRepository.load()` reconstructs a `TextList` with correct items and IDs from `localStorage`
- [x] `src/index.ts` re-exports all items listed in the Description (no more, no less)
- [x] `packages/core/package.json` has `main`, `module`, `types`, `exports`, and `scripts.build`
- [x] `tsup.config.ts` exists with ESM + CJS + `dts: true`
- [x] `pnpm --filter @repo/core build` exits 0 and produces `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`
- [x] TypeScript compiles with zero errors

### Test Cases
`LocalStorageListRepository` has no dedicated test file in this issue — it requires a real browser `localStorage`, which is tested via integration tests in ISSUE-5 using jsdom. Manual verification after `pnpm build`:
- Confirm `dist/` directory contains the three expected output files
- Confirm `dist/index.d.ts` exports the expected types

### Files Likely Affected
- `packages/core/src/infrastructure/LocalStorageListRepository.ts`
- `packages/core/src/index.ts`
- `packages/core/tsup.config.ts`
- `packages/core/package.json`

### Context & Constraints
- **Why both ESM and CJS?** The React app (Vite, ESM) and some test tooling (Vitest with CJS interop) both need to resolve `@repo/core`. Emitting both formats avoids compatibility issues.
- **`load()` must use `restoreItem`**, not `addItem`, to reconstruct the list — `addItem` re-validates text and generates a new UUID, destroying the persisted identity. `restoreItem` is the intended bypass for undo/restore operations.
- The `src/index.ts` barrel is the **single compiled entry** that `tsup` resolves — this is not an internal anti-pattern but the standard npm package boundary pattern.
- `tsup` must be installed as a `devDependency` in `packages/core/package.json`, not the monorepo root.
- After this issue, apps can reference `@repo/core` via their `package.json` `dependencies` using the workspace protocol: `"@repo/core": "workspace:*"`.
