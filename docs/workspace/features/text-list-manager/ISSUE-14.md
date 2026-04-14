## ISSUE-14: apps/vanilla-app — Tests (Integration + E2E)

**Feature**: text-list-manager
**Type**: feat
**Scope**: apps/vanilla-app tests + e2e
**Priority**: P1
**Depends on**: ISSUE-12

### Description
Write the full test suite for the vanilla app: integration tests (Vitest + jsdom) and E2E tests (Playwright).

Per **Testing Trophy**: integration tests are the widest layer. They mount the full component DOM under jsdom with a real `InMemoryListRepository` and simulate user events. E2E tests cover only critical paths that require a real browser.

---

**Integration test approach:**

Vanilla-app components manipulate the DOM directly. Tests mount `AppComponent` into a jsdom `document.body`, then interact via `dispatchEvent` and assert rendered DOM state.

Create `apps/vanilla-app/src/__tests__/InMemoryListRepository.js`:
```js
export class InMemoryListRepository {
  constructor() { this._stored = null; }
  save(list) { this._stored = list; }
  load() { return this._stored; }
}
```

Since `AppComponent` instantiates `LocalStorageListRepository` internally (hard-coded dependency), you need a way to inject `InMemoryListRepository` in tests. Options:
1. Add a `repo` parameter to `AppComponent` constructor (default to `LocalStorageListRepository` if not provided)
2. Use `vi.mock` to mock `@repo/core`'s `LocalStorageListRepository`

**Preferred:** Refactor `AppComponent` constructor to accept an optional `repo` parameter:
```js
constructor($root, repo = null) {
  super($root);
  this._repo = repo ?? new LocalStorageListRepository();
  ...
}
```
Tests pass `new InMemoryListRepository()` explicitly.

**Integration test file:** `apps/vanilla-app/src/components/AppComponent.test.js`

Each test:
1. Creates a `div` container and appends to `document.body`
2. Instantiates `new AppComponent(container, new InMemoryListRepository())`
3. Simulates user events using native DOM APIs (`click()`, `dispatchEvent(new KeyboardEvent(...))`, setting `value` + firing `input` event)
4. Asserts DOM state

```js
// Test helper
function setup() {
  const $root = document.createElement('div');
  document.body.appendChild($root);
  const repo = new InMemoryListRepository();
  const app = new AppComponent($root, repo);
  return { $root, repo, app };
}

afterEach(() => {
  document.body.innerHTML = '';
});
```

**Integration test cases:**

1. **Initial render** — empty list: `.item-list` has no children, delete button disabled, undo button disabled
2. **Add item** — click ADD button (modal opens), type in input (update value + fire `input` event), click modal ADD — item appears in `.item-list`, modal hidden
3. **Add item — ADD disabled when empty** — open modal, assert `.modal__add-btn` is disabled; set value, fire `input`, assert enabled
4. **Select item** — add item, click its `<li>` — it has class `item-list__item--selected`, delete button enabled
5. **Multi-select** — add 2 items, click first, ctrl+click second — both have `--selected`, delete enabled
6. **Delete selected** — add 2 items, select first, click delete — first removed, second remains
7. **Undo** — add item, undo — item removed
8. **Undo delete** — add item, select, delete, undo — item restored
9. **Double-click delete** — add item, double-click `<li>` — item removed
10. **Cancel modal** — open modal, type text, click CANCEL — modal hidden, no item added
11. **Error banner** — mock `repo.save` to throw, try to add item — `.error-banner` appears with `role="alert"`

For native DOM simulation in jsdom:
```js
// Type in input
input.value = 'Buy milk';
input.dispatchEvent(new Event('input', { bubbles: true }));

// Click
button.click();

// Ctrl+click
li.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));

// Double-click
li.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
```

---

**E2E test file:** `apps/vanilla-app/e2e/app.spec.js`

Same scenarios as react-app E2E (both apps must pass identical flows). Navigate to `http://localhost:5174` (configured as `baseURL` in `playwright.config.js`).

```js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
});

test('add item, see it in list', async ({ page }) => { ... });
test('select item, delete, confirm removal', async ({ page }) => { ... });
test('undo restores previous state', async ({ page }) => { ... });
test('double-click deletes item', async ({ page }) => { ... });
test('empty input blocked — Add button disabled', async ({ page }) => { ... });
test('multi-select: ctrl+click two items, delete both', async ({ page }) => { ... });
```

For Ctrl+click in Playwright:
```js
await page.click('.item-list__item:nth-child(2)', { modifiers: ['Control'] });
```

### Acceptance Criteria
- [ ] `apps/vanilla-app/src/__tests__/InMemoryListRepository.js` exists
- [ ] `AppComponent` accepts optional `repo` parameter for dependency injection
- [ ] `pnpm --filter vanilla-app test` passes with all 11 integration tests green
- [ ] `apps/vanilla-app/e2e/app.spec.js` has all 6 E2E scenarios
- [ ] `pnpm --filter vanilla-app test:e2e` passes with all 6 E2E tests green
- [ ] E2E tests clear `localStorage` in `beforeEach`

### Test Cases
(See "Integration test cases" and "E2E test file" sections above.)

### Files Likely Affected
- `apps/vanilla-app/src/__tests__/InMemoryListRepository.js`
- `apps/vanilla-app/src/components/AppComponent.test.js`
- `apps/vanilla-app/src/components/AppComponent.js` (repo injection)
- `apps/vanilla-app/e2e/app.spec.js`

### Context & Constraints
- Testing strategy is **Testing Trophy**: integration tests are the majority; E2E is critical-paths only.
- jsdom does not perfectly simulate all browser behaviours — `localStorage` is available in jsdom but may behave differently. Use `InMemoryListRepository` injection for integration tests to avoid `localStorage` dependency.
- `AppComponent` requires the `repo` injection refactor before tests can work — modify the constructor default parameter (do not change callers in `main.js`; the default `null → new LocalStorageListRepository()` keeps production behaviour identical).
- For multi-select in integration tests, dispatch `MouseEvent` with `ctrlKey: true` — jsdom supports this.
- E2E tests are run against the **live Vite dev server** on port 5174 — `playwright.config.js` auto-starts it.
- Install Playwright browsers if not already: `pnpm --filter vanilla-app exec playwright install`.
- The E2E suite for vanilla-app is intentionally identical in coverage to react-app E2E — both apps must pass the same functional scenarios.
