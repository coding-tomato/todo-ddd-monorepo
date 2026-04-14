# Design Spec: Text List Manager — Technical Architecture

## Context

This is a technical assessment for demonstrating seniority. The goal is a "Text List Manager" app that manages a list of strings with add, delete, multi-select, and undo. The spec asks for both a Vanilla JS and a React solution. The strategy is to showcase: monorepo tooling, DDD with clean architecture, ports/adapters pattern, and a Testing Trophy approach applied consistently across both apps.

---

## Architecture Decision: pnpm Monorepo

```
/
├── packages/
│   └── core/                  # Shared business logic (TS → ESM + .d.ts)
├── apps/
│   ├── react-app/             # React 18 + TypeScript + Vite
│   └── vanilla-app/           # Vanilla JS + Vite (consumes compiled core)
├── pnpm-workspace.yaml
└── package.json               # root: scripts only, no deps
```

**Why shared core compiles to JS:** The vanilla app cannot consume raw TypeScript. The `packages/core` package is authored in TypeScript and built to ESM with `.d.ts` declaration files (via `tsup`). Both apps import the compiled output. The React app gets full type safety via `.d.ts`; the vanilla app gets the runtime behavior and editor completions via the same declarations. This mirrors how real npm packages work — the distinction between TypeScript as a development tool and JavaScript as a runtime artifact.

---

## packages/core — Domain-Driven Design

### Domain Layer (`src/domain/`)

**`ListItem` — Entity**
```
id: string (UUID v4)
text: string
isSelected: boolean
```

**`TextList` — Aggregate Root**
- `items: ListItem[]`
- Invariants enforced internally:
  - `addItem(text: string)`: throws if text is empty/whitespace after trim; returns the created `ListItem`
  - `deleteSelected()`: throws if no items are selected; returns `{ item, index }[]` of removed items
  - `deleteById(id: string)`: returns `{ item, index }` of removed item
  - `selectItem(id: string)`: single select (deselects others)
  - `toggleItem(id: string)`: multi-select toggle
  - `restoreItem(item: ListItem, index: number)`: re-inserts a previously removed item at its original position — used exclusively by command `undo()` implementations
- No undo knowledge here — history is managed by `CommandHistory` in the application layer

**Value Objects**
- `ItemId`: thin wrapper ensuring UUID format (used for type safety in TS consumers)

### Application Layer (`src/application/`)

Mutations are modelled as **Command objects** rather than plain functions. Each command captures the list state before executing (snapshot), applies its domain operation, and persists. `CommandHistory` manages the stack — `undo()` pops the last command and restores its snapshot.

**`Command` interface:**
```ts
export interface Command {
  execute(): TextList;
  undo(): TextList;
}
```

**`CommandHistory`:**
```ts
const MAX_HISTORY = 50;

export class CommandHistory {
  private stack: Command[] = [];

  execute(command: Command): TextList {
    const result = command.execute();
    this.stack.push(command);
    if (this.stack.length > MAX_HISTORY) this.stack.shift();
    return result;
  }

  undo(): TextList | null {
    return this.stack.pop()?.undo() ?? null;
  }

  get canUndo(): boolean { return this.stack.length > 0; }
}
```

History is capped at 50 steps — the oldest entry is dropped when the limit is exceeded, preventing unbounded memory growth in long sessions. Each command implements its own inverse operation rather than storing a full list snapshot.

| Command | Undoable | Notes |
|---|---|---|
| `AddItemCommand` | yes | snapshot before add |
| `DeleteSelectedCommand` | yes | snapshot before delete |
| `DeleteByIdCommand` | yes | snapshot before delete |
| `SelectItemCommand` | no | selection is transient UI state, not pushed to history |
| `ToggleItemCommand` | no | same |
| `loadList(repo)` | — | plain function, not a command |

### Directory Structure

```
packages/core/src/
├── domain/
│   ├── TextList.ts                       # Aggregate root
│   ├── ListItem.ts                       # Entity
│   └── repositories/
│       └── ListRepository.ts             # Interface (domain contract)
├── application/
│   ├── Command.ts                        # Command interface
│   ├── CommandHistory.ts                 # Stack manager (execute / undo / canUndo)
│   ├── commands/
│   │   ├── AddItemCommand.ts
│   │   ├── DeleteSelectedCommand.ts
│   │   └── DeleteByIdCommand.ts
│   └── loadList.ts                       # Plain function — no undo semantics
└── infrastructure/
    └── LocalStorageListRepository.ts     # Shared by both apps
```

**`ListRepository` interface:**
```ts
export interface ListRepository {
  save(list: TextList): void;
  load(): TextList | null;
}
```

The aggregate (`TextList`) is the unit of persistence — the repository saves and loads the full aggregate, not raw items. This keeps the domain model intact and avoids leaking internal structure.

`LocalStorageListRepository` lives in `infrastructure/` because both apps target the same browser environment and the implementation is identical. The apps are still the **composition root** — they instantiate and inject the repository — but they don't own the implementation.

`InMemoryListRepository` (test double) lives in each app's `__tests__/` utilities — it's test infrastructure, not shared production code.

### Build

- Tool: `tsup`
- Output: `dist/` → ESM + CJS + `.d.ts`
- Entry: `src/index.ts` — the package's public API surface; explicitly re-exports only what consumers should import from `@repo/core` (entities, repository interface, `Command`, `CommandHistory`, command classes, `loadList`). This is not the internal barrel-export anti-pattern — it is the single compiled entry point that `tsup` resolves, and bundlers tree-shake the output normally.

---

## apps/react-app

**Stack:** React 18, TypeScript, Vite, Vitest, React Testing Library, Playwright

**State:** Plain `useState` — no global store. The use cases from `@repo/core` are pure functions; the React app simply calls them and stores the returned `TextList` in local component state. No Redux, no Zustand — they'd be over-engineering for this scope.

**Infrastructure:** `LocalStorageListRepository` implementing `ListRepository` (wired at app root).

### Component Tree

Each component owns a single responsibility — no logic leaks into `App` beyond wiring.

```
App
├── ItemList
│   └── ListItemRow[]    # click = selectItem, dblclick = deleteById; highlights selected
├── ActionBar            # Undo button, Delete button (disabled if no selection), Add button
└── AddItemModal         # shown/hidden via local boolean state; contains input + ADD/CANCEL
```

Add is triggered by the ADD button in `ActionBar`, which sets `isModalOpen = true`. The modal is its own component — it owns the input field and calls `onAdd(text)` on confirm, `onClose()` on cancel or successful submit.

### Hook: `useTextList(repo: ListRepository)`
Encapsulates `useState<TextList>` and exposes handler functions that call use cases and update state. Keeps components thin — they receive handlers as props and render list data, nothing more.

---

## apps/vanilla-app

**Stack:** Vanilla JS (ES modules), Vite, Vitest, Playwright

**No framework.** DOM manipulation via vanilla `document.querySelector`. Imports compiled `@repo/core` use cases directly.

### Component Model

The UI is split into ES module classes that all extend a shared `Component` base. The base enforces the `_bindEvents` / `render` contract and wires up DOM refs; sub-components override both.

```
src/
├── main.js                    # bootstrap: instantiate repo, mount AppComponent
└── components/
    ├── Component.js           # base class — enforces _bindEvents / render contract
    ├── AppComponent.js        # root — coordinates sub-components, holds state
    ├── ItemListComponent.js   # renders list items, fires select/delete events
    ├── ActionBarComponent.js  # Undo, Delete, and Add buttons
    └── AddItemModal.js        # modal overlay — shown/hidden, owns the input field
```

**Base class:**
```js
export class Component {
  constructor($root) {
    this.$root = $root;
    this.$ = {};
  }
  _bindEvents() {}
  render(list) {}
}
```

**Sub-component** — extends base, populates `$`, overrides both methods:
```js
export class AddFormComponent extends Component {
  constructor($root, onAdd) {
    super($root);
    this.$ = {
      input: $root.querySelector('.add-input'),
      button: $root.querySelector('.add-btn'),
    };
    this._bindEvents(onAdd);
  }
  _bindEvents(onAdd) {
    this.$.button.addEventListener('click', () => {
      onAdd(this.$.input.value);
      this.$.input.value = '';
    });
  }
  render(list) {
    this.$.button.disabled = !this.$.input.value.trim();
  }
}
```

`AppComponent` holds the current `TextList`, calls use cases on user actions, and calls `render(list)` on each sub-component after every mutation.

**Rendering strategy:** Full re-render on every state change (like React but manual). Simple, predictable, easy to test.

---

## Styling

**Plain CSS with BEM** — shared stylesheet in `packages/core/styles/` or duplicated per app (since vanilla and React have different asset pipelines). BEM avoids class conflicts without needing CSS Modules or a preprocessor. Works identically in both apps.

**Design reference:** `docs/design/` contains the design mockup and design tokens (colours, spacing, typography). Implement styles from those — do not invent values.

### Design Description

**`todo_list.png` — main view**

A centered white card with large border-radius on a light blue/periwinkle gradient background. The card has:
- A heading ("This is a technical proof") and a short description paragraph at the top.
- A scrollable list area below. Each row is a plain text item; selected items are highlighted with a solid blue background and white text. Only one item appears selected in the mockup (single-select default).
- A bottom action bar inside the card with three controls left-to-right: a circular icon-only **Undo** button (outlined), a text **DELETE** button (outlined, secondary style), and a pill-shaped solid-blue **ADD** button on the far right.

**`modal_add_new_todo.png` — add item modal**

Clicking ADD opens a modal overlay. The modal is a smaller white card (same border-radius language) centred over the main view. It contains:
- A label: "Add item to list".
- A full-width text input with placeholder "Type the text here…".
- Two pill-shaped buttons right-aligned: solid-blue **ADD** and outlined **CANCEL**.

The modal is dismissed by CANCEL or a successful ADD submission.

---

## Testing Strategy — Testing Trophy

```
         /‾‾‾‾‾‾‾‾‾‾‾\
        /    E2E (few)  \        ← Playwright, critical paths only
       /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
      / Integration (most) \     ← Widest layer, highest ROI
     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
    /    Unit (targeted)     \   ← Pure domain logic only
   /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
  /  Static Analysis (always)  \ ← TypeScript strict + ESLint
 \_____________________________/
```

The integration layer is the largest investment — tests that exercise real use cases, real adapters, and real component trees without a browser. E2E covers only the flows that integration tests cannot (true browser behaviour, focus management, keyboard nav).

### Test Colocation

Test files live next to the module they cover, not in a separate `__tests__/` tree:
```
src/domain/TextList.ts
src/domain/TextList.test.ts      ← unit tests for the aggregate
src/application/useCases.ts
src/application/useCases.test.ts ← integration tests with InMemoryListRepository
components/AddFormComponent.js
components/AddFormComponent.test.js
```
E2E suites are the exception — they live in `e2e/` at the app root since they span the whole app, not a single module.

### Static Analysis (base)
- TypeScript strict mode across `packages/core` and `react-app`
- ESLint with shared root config, extended per package

### Unit Tests — business logic only (Vitest)
Reserved for pure domain logic with no collaborators and non-trivial invariants. UI code is not unit tested in isolation — component rendering is covered by integration tests instead.
- `TextList` aggregate: empty text throws, delete without selection throws, undo with no prior state is no-op, snapshot saved before every mutation
- `ListItem` entity: construction, selection toggling

### Integration Tests — widest layer (Vitest)

UI tests belong here, not at the unit level. Components are tested through the full rendered tree with real (in-memory) infrastructure — this catches wiring bugs that shallow unit tests miss.

**`packages/core`:** Use cases exercised with an `InMemoryListRepository` — add, delete, multi-select, undo, load/persist round-trip.

**`apps/react-app`:** Full component tree rendered with RTL + `InMemoryListRepository`. Simulates user events (type, click, keyboard) and asserts DOM outcomes. Tests `useTextList` hook behaviour implicitly through the UI, not in isolation.

**`apps/vanilla-app`:** Full DOM mounted via jsdom. Event simulation against mounted components with `InMemoryListRepository`. Asserts rendered list state.

### E2E Tests — critical paths only (Playwright)
One Playwright suite per app, covering flows that require a real browser:
- Add item, see it in list
- Select item(s), delete, confirm removal
- Undo restores previous state
- Double-click deletes item
- Empty input blocked (Add button disabled / validation message)
- Multi-select: Ctrl+click two items, delete both at once

---

## Tooling & Root Config

| Tool | Purpose |
|---|---|
| `pnpm` + workspaces | Package management + monorepo linking |
| `tsup` | Build `packages/core` to ESM + `.d.ts` |
| `Vite` | Dev server + build for both apps |
| `Vitest` | Unit + integration tests across all packages |
| `Playwright` | E2E tests for both apps |
| `TypeScript` | Strict mode, `packages/core` + `react-app` |
| `ESLint` | Root config extended per package |

**Root scripts:**
```json
"test": "pnpm -r test",
"build": "pnpm --filter @repo/core build && pnpm -r --filter !@repo/core build",
"dev:react": "pnpm --filter react-app dev",
"dev:vanilla": "pnpm --filter vanilla-app dev"
```

---

## Undo Implementation Detail

Multi-step undo via the **Command pattern**. `TextList` holds no history — that responsibility lives entirely in `CommandHistory`.

Each command implements its own inverse operation. No full-list snapshots are stored — only the minimal data needed to reverse the specific mutation. The aggregate's domain methods return what the command needs to reverse them:

```ts
export class AddItemCommand implements Command {
  private addedId: string;

  constructor(private list: TextList, private text: string, private repo: ListRepository) {}

  execute(): TextList {
    const item = this.list.addItem(this.text); // returns created ListItem
    this.addedId = item.id;
    this.repo.save(this.list);
    return this.list;
  }

  undo(): TextList {
    this.list.deleteById(this.addedId);
    this.repo.save(this.list);
    return this.list;
  }
}

export class DeleteSelectedCommand implements Command {
  private removed: { item: ListItem; index: number }[];

  constructor(private list: TextList, private repo: ListRepository) {}

  execute(): TextList {
    this.removed = this.list.deleteSelected(); // returns removed items + positions
    this.repo.save(this.list);
    return this.list;
  }

  undo(): TextList {
    // restore in reverse order so earlier indices stay valid during re-insertion
    [...this.removed].reverse().forEach(({ item, index }) => {
      this.list.restoreItem(item, index);
    });
    this.repo.save(this.list);
    return this.list;
  }
}
```

`DeleteByIdCommand` follows the same pattern as `DeleteSelectedCommand` — stores the single removed item and its index, restores on undo.

Apps use `CommandHistory` as the single entry point for all mutations:
```ts
// React (useTextList hook) / Vanilla (AppComponent)
const result = history.execute(new AddItemCommand(list, text, repo));
setState(result);

// undo button
const result = history.undo();
if (result) setState(result);
```

The undo button is disabled when `!history.canUndo`. Adding redo later means adding a redo stack to `CommandHistory` — no other code changes.

---

## Multi-Select Detail

- **Click** a non-selected item → `selectItem(id)`: deselects all others, selects this one (single-select default)
- **Click** an already-selected item with modifier key (Ctrl/Cmd) → `toggleItem(id)`: true multi-select toggle
- The Delete button is enabled when `items.some(i => i.isSelected)` 
- `deleteSelected()` removes all items where `isSelected === true`

---

## Error Boundaries

Errors can be thrown by domain invariants (e.g. `addItem` with empty text, `deleteSelected` with no selection) or by `LocalStorageListRepository` (e.g. `localStorage` quota exceeded, corrupted JSON on `load`).

### React App — `ErrorBoundary` component

React error boundaries catch errors thrown during render, in lifecycle methods, and in child component trees. Errors thrown inside event handlers are **not** caught by error boundaries — those must be handled explicitly.

**Component:**
```
App
├── ErrorBoundary              # wraps the entire app
│   ├── AddItemForm
│   ├── ItemList
│   └── ActionBar
```

`ErrorBoundary` is a class component (the only way to implement `componentDidCatch` / `getDerivedStateFromError` in React). It renders a fallback UI when an uncaught render error occurs.

**Event handler errors (use cases):** The `useTextList` hook wraps each use case call in a `try/catch`. On error, it sets a local `error: string | null` state that the UI surfaces as an inline message (e.g. "Something went wrong, please try again") — no full-page crash for recoverable errors.

**Repository errors:** `LocalStorageListRepository.load()` wraps JSON parsing in `try/catch` and returns `null` on failure (treated as an empty list). `save()` wraps the write and silently swallows quota errors — the app remains functional, persistence just fails gracefully.

### Vanilla App — `errorHandler` module

No framework means no component lifecycle — errors must be caught at the call site.

**`src/errorHandler.js`** — a small module with two responsibilities:
1. `handleError(err)`: renders an error banner into the DOM (e.g. a `<div class="error-banner">` prepended to `#app`), auto-dismissed after 4 seconds.
2. `withErrorHandling(fn)`: a higher-order wrapper used in `handlers.js` to wrap every use case call.

```js
// handlers.js usage
document.querySelector('#add-btn').addEventListener('click',
  withErrorHandling(() => {
    state.list = addItem(state.list, input.value, repo);
    render(state);
  })
);
```

**Repository errors:** Same strategy as React — `load()` returns `null` on parse failure, `save()` swallows quota errors.

**Global fallback:** A `window.onerror` / `window.onunhandledrejection` handler in `main.js` catches anything that slips through, rendering a last-resort error message rather than a silent broken UI.

---

## Verification Plan

1. `pnpm build` — core builds cleanly, apps resolve `@repo/core` from compiled dist
2. `pnpm -r test` — all unit + integration tests pass
3. `pnpm --filter react-app exec playwright test` — all E2E scenarios pass
4. `pnpm --filter vanilla-app exec playwright test` — same scenarios pass
5. Manual smoke test: add item, multi-select two items, delete, undo, verify restored, double-click delete
6. Accessibility: keyboard navigation through list items (Tab/Enter/Delete key support)