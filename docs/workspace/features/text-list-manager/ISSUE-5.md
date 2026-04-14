## ISSUE-5: packages/core — Test Suite (Unit + Integration)

**Feature**: text-list-manager
**Type**: feat
**Scope**: packages/core tests
**Priority**: P1
**Depends on**: ISSUE-4

### Description
Add Vitest configuration to `packages/core` and write all unit and integration tests for the domain and application layers. Tests are colocated with the source files they cover (per-spec convention — test files live next to module files, not in a separate `__tests__/` tree).

This issue also creates the `InMemoryListRepository` test double, which lives in `packages/core/src/__tests__/InMemoryListRepository.ts` (test infrastructure, not production code).

**Vitest config** (`packages/core/vitest.config.ts`):
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // needed for LocalStorageListRepository tests
    globals: true,
  },
});
```

**Update `packages/core/package.json` scripts:**
```json
"scripts": {
  "build": "tsup",
  "dev": "tsup --watch",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Add Vitest to devDependencies:
```json
"devDependencies": {
  "tsup": "^8.0.0",
  "typescript": "^5.4.0",
  "vitest": "^1.0.0",
  "jsdom": "^24.0.0",
  "@vitest/coverage-v8": "^1.0.0"
}
```

**`InMemoryListRepository`** (`src/__tests__/InMemoryListRepository.ts`):
```ts
import type { TextList } from '../domain/TextList';
import type { ListRepository } from '../domain/repositories/ListRepository';

export class InMemoryListRepository implements ListRepository {
  private stored: TextList | null = null;

  save(list: TextList): void {
    this.stored = list;
  }

  load(): TextList | null {
    return this.stored;
  }
}
```

---

### Tests to write

**Unit tests** — pure domain logic, no collaborators:

`src/domain/TextList.test.ts`:
- `addItem('hello')` returns item with UUID id and appends to `getItems()`
- `addItem('')` throws "Item text cannot be empty"
- `addItem('   ')` throws "Item text cannot be empty"
- `addItem('  hello  ')` stores text as `'hello'` (trimmed)
- `deleteSelected()` with no selections throws "No items selected"
- `deleteSelected()` removes only selected items, returns `{ item, index }[]` with pre-removal indices
- `deleteById(id)` removes correct item, returns `{ item, index }`
- `deleteById('nonexistent')` throws "Item not found"
- `selectItem(id)` deselects all others, selects only target
- `toggleItem(id)` toggles only target, leaves others unchanged
- `restoreItem(item, 0)` inserts at position 0, shifting existing items right
- Full round-trip: add 3 items, select 2 (non-contiguous), delete, undo (restore in reverse order), list equals original

`src/domain/ListItem.test.ts`:
- `createItemId()` returns a UUID v4 format string (`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)
- Two calls return different values

**Integration tests** — commands exercised with `InMemoryListRepository`:

`src/application/CommandHistory.test.ts`:
- `canUndo` is false on init
- After `execute(cmd)`, `canUndo` is true
- `undo()` returns `null` when stack empty
- `undo()` returns restored list and sets `canUndo` to false (if only 1 command was in stack)
- Stack cap: execute 51 commands, `stack.length` must be 50 (oldest dropped)

`src/application/commands/AddItemCommand.test.ts`:
- `execute()` adds item to list, calls `repo.save()`
- `undo()` removes the added item, calls `repo.save()`
- `execute()` with empty text throws (propagates domain invariant)

`src/application/commands/DeleteSelectedCommand.test.ts`:
- `execute()` removes selected items, calls `repo.save()`
- `undo()` restores items at their original positions
- `execute()` throws when no items selected

`src/application/commands/DeleteByIdCommand.test.ts`:
- `execute()` removes item by id, calls `repo.save()`
- `undo()` restores item at original position

`src/application/loadList.test.ts`:
- Returns new empty `TextList` when `repo.load()` returns `null`
- Returns the stored `TextList` when repo has persisted data

`src/infrastructure/LocalStorageListRepository.test.ts` (jsdom environment):
- `save()` + `load()` round-trip: save list with 2 items, load returns list with same items and IDs
- `load()` returns `null` when `localStorage` is empty
- `load()` returns `null` when `localStorage` contains invalid JSON (corrupted)
- `save()` does not throw when `localStorage.setItem` throws `QuotaExceededError` (mock `localStorage.setItem` to throw)

### Acceptance Criteria
- [ ] `packages/core/vitest.config.ts` exists with `environment: 'jsdom'`
- [ ] `pnpm --filter @repo/core test` runs and all tests pass
- [ ] `InMemoryListRepository` exists at `src/__tests__/InMemoryListRepository.ts` and correctly implements `ListRepository`
- [ ] All unit tests listed above pass
- [ ] All integration tests listed above pass
- [ ] `LocalStorageListRepository` round-trip test passes under jsdom
- [ ] No tests test UI components or React — those belong in ISSUE-10

### Test Cases
(See "Tests to write" section above — this issue IS the test implementation.)

### Files Likely Affected
- `packages/core/vitest.config.ts`
- `packages/core/package.json`
- `packages/core/src/__tests__/InMemoryListRepository.ts`
- `packages/core/src/domain/TextList.test.ts`
- `packages/core/src/domain/ListItem.test.ts`
- `packages/core/src/application/CommandHistory.test.ts`
- `packages/core/src/application/commands/AddItemCommand.test.ts`
- `packages/core/src/application/commands/DeleteSelectedCommand.test.ts`
- `packages/core/src/application/commands/DeleteByIdCommand.test.ts`
- `packages/core/src/application/loadList.test.ts`
- `packages/core/src/infrastructure/LocalStorageListRepository.test.ts`

### Context & Constraints
- Testing strategy is **Testing Trophy** (not pyramid): unit tests are reserved for pure domain logic with no collaborators. Application layer tests are integration tests using `InMemoryListRepository` — they exercise real domain + real commands together.
- `LocalStorageListRepository` tests require `jsdom` because `localStorage` is a browser API. Vitest's `environment: 'jsdom'` provides this.
- The `InMemoryListRepository` test double lives here because it is test infrastructure — it must NOT be exported from `src/index.ts` or included in the production build.
- Test files are **colocated** with the source: `TextList.test.ts` is in `src/domain/`, not `__tests__/`. The exception is `InMemoryListRepository.ts` which is in `src/__tests__/` because it is a shared test utility for multiple test files.
- Use `vi.spyOn` (Vitest) to verify `repo.save()` is called in command tests.
