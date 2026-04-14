## ISSUE-10: apps/react-app — Tests (Integration + E2E)

**Feature**: text-list-manager
**Type**: feat
**Scope**: apps/react-app tests + e2e
**Priority**: P1
**Depends on**: ISSUE-8

### Description
Write the full test suite for the React app: integration tests (Vitest + React Testing Library) and E2E tests (Playwright).

Per **Testing Trophy**: integration tests are the widest layer. They render the full component tree with a real `InMemoryListRepository` and simulate user events. E2E tests cover only critical paths that require a real browser.

---

**Integration test setup:**

Create `apps/react-app/src/__tests__/InMemoryListRepository.ts` (same as the one in `packages/core` but local — test infrastructure, not shared code):
```ts
import type { TextList, ListRepository } from '@repo/core';

export class InMemoryListRepository implements ListRepository {
  private stored: TextList | null = null;
  save(list: TextList): void { this.stored = list; }
  load(): TextList | null { return this.stored; }
}
```

**Integration test file:** `apps/react-app/src/components/App.test.tsx`

Each test renders `<App>` but overrides the repository by restructuring. However, since `App` instantiates `LocalStorageListRepository` internally, tests need a way to inject `InMemoryListRepository`. The cleanest approach: extract a `<TextListApp repo={repo} />` inner component that accepts `repo` as a prop, and have `App` just wire up the repo. Tests render `<TextListApp repo={new InMemoryListRepository()} />`.

Alternatively, create a `AppWithRepo` or test-specific `App` wrapper:
```tsx
// src/components/App.tsx exports both:
export function App() {
  const repo = useMemo(() => new LocalStorageListRepository(), []);
  return <TextListApp repo={repo} />;
}
export function TextListApp({ repo }: { repo: ListRepository }) {
  // ... full component tree
}
```

Tests import and render `TextListApp` directly.

**Integration test cases** (`App.test.tsx`):

1. **Initial render** — empty list: no list items rendered, Delete button disabled, Undo button disabled
2. **Add item** — click ADD button, modal appears; type "Buy milk", click modal ADD — item "Buy milk" appears in list, modal closes
3. **Add item — empty blocked** — open modal, modal ADD button disabled when input empty; type then clear input — still disabled
4. **Select item** — add item, click it — item has selected class, Delete button becomes enabled
5. **Multi-select** — add 2 items, ctrl+click both — both show selected class, Delete enabled
6. **Delete selected** — add 2 items, select first, click Delete — first item removed, second remains
7. **Undo add** — add item, click Undo — item removed, Undo button disabled again
8. **Undo delete** — add item, select it, delete, click Undo — item restored
9. **Double-click delete** — add item, double-click it — item removed
10. **Error shown** — mock `repo.save` to throw, add item — error banner appears with `role="alert"`
11. **Error cleared on next success** — add item (errors), fix mock, add another — error banner disappears

Use `@testing-library/user-event` for all user interactions (type, click, dblClick, keyboard).

---

**E2E test file:** `apps/react-app/e2e/app.spec.ts`

E2E tests run against the live Vite dev server (Playwright auto-starts it via `playwright.config.ts`).

```ts
import { test, expect } from '@playwright/test';

test('add item, see it in list', async ({ page }) => { ... });
test('select item, delete, confirm removal', async ({ page }) => { ... });
test('undo restores previous state', async ({ page }) => { ... });
test('double-click deletes item', async ({ page }) => { ... });
test('empty input blocked — Add button disabled', async ({ page }) => { ... });
test('multi-select: ctrl+click two items, delete both', async ({ page }) => { ... });
```

Each test must navigate to `http://localhost:5173` (configured as `baseURL` in `playwright.config.ts`). Note: E2E tests use `localStorage` via the real browser — items added in one test may persist. Use `page.evaluate(() => localStorage.clear())` in `beforeEach` or `test.beforeEach` to reset state between tests.

### Acceptance Criteria
- [ ] `apps/react-app/src/__tests__/InMemoryListRepository.ts` exists
- [ ] `pnpm --filter react-app test` passes with all 11 integration tests green
- [ ] Integration tests render `TextListApp` (or equivalent) with `InMemoryListRepository`
- [ ] All integration test cases listed above are implemented
- [ ] `apps/react-app/e2e/app.spec.ts` exists with all 6 E2E test scenarios
- [ ] `pnpm --filter react-app test:e2e` passes with all 6 E2E tests green
- [ ] E2E tests clear `localStorage` before each test

### Test Cases
(See "Integration test cases" and "E2E test file" sections above.)

### Files Likely Affected
- `apps/react-app/src/__tests__/InMemoryListRepository.ts`
- `apps/react-app/src/components/App.test.tsx`
- `apps/react-app/src/components/App.tsx` (may need `TextListApp` refactor for testability)
- `apps/react-app/e2e/app.spec.ts`

### Context & Constraints
- Testing strategy is **Testing Trophy**: integration tests are the majority of tests; E2E covers only real-browser paths.
- `useTextList` hook is **NOT tested in isolation** via `renderHook`. Its behaviour is fully covered by `App.test.tsx` which renders the full component tree.
- Use `@testing-library/user-event` for interactions (not `fireEvent`) — it more accurately simulates real user behaviour (focus, keyboard events, etc.).
- For Ctrl+click in RTL: `await userEvent.click(element, { ctrlKey: true })`.
- `@testing-library/jest-dom` matchers (`toBeDisabled`, `toBeInTheDocument`, `toHaveClass`) are available via `test-setup.ts` (configured in ISSUE-6).
- For the error banner test, spy on `InMemoryListRepository.save` to throw: `vi.spyOn(repo, 'save').mockImplementation(() => { throw new Error('Storage full') })`.
- E2E tests are **not duplicating** integration tests — they specifically test: real browser localStorage persistence, real keyboard events (Ctrl+click multi-select), and real focus management (modal opens and input is focused).
- Install Playwright browsers before first E2E run: `pnpm --filter react-app exec playwright install`.
