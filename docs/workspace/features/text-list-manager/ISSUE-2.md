## ISSUE-2: packages/core — Domain Layer

**Feature**: text-list-manager
**Type**: feat
**Scope**: packages/core/src/domain
**Priority**: P0
**Depends on**: ISSUE-1

### Description
Implement the Domain layer of `packages/core`. This is pure business logic — no framework, no I/O. It contains the `ListItem` entity, the `TextList` aggregate root, the `ItemId` value object, and the `ListRepository` interface (a port, to be implemented in infrastructure).

**Package setup:**
```
packages/core/
├── package.json
├── tsconfig.json
└── src/
    └── domain/
        ├── ListItem.ts
        ├── TextList.ts
        └── repositories/
            └── ListRepository.ts
```

**`packages/core/package.json`** (partial — build fields added in ISSUE-4):
```json
{
  "name": "@repo/core",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

**`packages/core/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**`ListItem` entity:**
```ts
export interface ListItem {
  id: string;       // UUID v4
  text: string;
  isSelected: boolean;
}
```

**`ItemId` value object** — thin type wrapper that enforces UUID format at construction. Used only by TypeScript consumers for type safety; the underlying value is a plain string.
```ts
export type ItemId = string & { readonly __brand: 'ItemId' };

export function createItemId(): ItemId {
  return crypto.randomUUID() as ItemId;
}
```

**`ListRepository` interface (port):**
```ts
import type { TextList } from '../TextList';

export interface ListRepository {
  save(list: TextList): void;
  load(): TextList | null;
}
```

**`TextList` aggregate root** — enforces domain invariants. Methods throw on violations. Internal `items` array is never exposed directly; mutations go through methods.

Required methods:
- `addItem(text: string): ListItem` — trims text, throws `Error('Item text cannot be empty')` if blank after trim; generates UUID id; adds to items; returns the created item
- `deleteSelected(): { item: ListItem; index: number }[]` — throws `Error('No items selected')` if nothing selected; removes all selected items; returns array of `{ item, index }` (original index before removal, needed for undo)
- `deleteById(id: string): { item: ListItem; index: number }` — removes the item with the given id; throws `Error('Item not found')` if id does not exist; returns `{ item, index }`
- `selectItem(id: string): void` — deselects all items, then selects the item with the given id (single-select)
- `toggleItem(id: string): void` — toggles `isSelected` on the item with the given id only (multi-select)
- `restoreItem(item: ListItem, index: number): void` — re-inserts a previously removed item at the given index; used exclusively by command `undo()` implementations

`TextList` should be a class with a private `items` array and a public `getItems(): ReadonlyArray<ListItem>` getter. The aggregate is the unit of persistence — the repository saves and loads the full instance.

### Acceptance Criteria
- [x] `packages/core/package.json` exists with `name: "@repo/core"` and `type: "module"`
- [x] `packages/core/tsconfig.json` extends `../../tsconfig.base.json`
- [x] `ListItem` interface exported from `domain/ListItem.ts`
- [x] `ItemId` branded type + `createItemId()` exported from `domain/ListItem.ts`
- [x] `ListRepository` interface exported from `domain/repositories/ListRepository.ts`
- [x] `TextList` class exported from `domain/TextList.ts`
- [x] `addItem('')` throws with message "Item text cannot be empty"
- [x] `addItem('  ')` (whitespace only) throws with message "Item text cannot be empty"
- [x] `deleteSelected()` with no selected items throws "No items selected"
- [x] `deleteSelected()` returns `{ item, index }[]` with correct original indices
- [x] `deleteById('nonexistent')` throws "Item not found"
- [x] `selectItem(id)` deselects all other items
- [x] `toggleItem(id)` does not affect other items
- [x] `restoreItem(item, 0)` re-inserts at position 0
- [x] TypeScript compiles with zero errors under `strict: true`

### Test Cases
These are unit tests (pure domain, no I/O). Test file: `src/domain/TextList.test.ts`

- `addItem` with valid text returns item with UUID id and appends to `getItems()`
- `addItem('')` throws "Item text cannot be empty"
- `addItem('   ')` throws "Item text cannot be empty" (whitespace trim)
- `addItem` trims text before storing (e.g. `'  hello  '` → stored as `'hello'`)
- `deleteSelected` throws when no items selected
- `deleteSelected` removes all selected items and returns them with correct indices
- `deleteById` removes the correct item and returns it with its index
- `deleteById` with unknown id throws "Item not found"
- `selectItem` deselects all others and selects the target
- `toggleItem` toggles only the target item
- `restoreItem` re-inserts item at specified index, shifting existing items
- After `deleteSelected` + `restoreItem` for each removed item (reverse order), list is identical to before delete

Test file for `ListItem`/`ItemId`: `src/domain/ListItem.test.ts`
- `createItemId()` returns a string matching UUID v4 format
- Two calls to `createItemId()` return different values

### Files Likely Affected
- `packages/core/package.json`
- `packages/core/tsconfig.json`
- `packages/core/src/domain/ListItem.ts`
- `packages/core/src/domain/TextList.ts`
- `packages/core/src/domain/repositories/ListRepository.ts`

### Context & Constraints
- This is a **pnpm monorepo** — `packages/core` is a workspace package. Root `tsconfig.base.json` must be extended (not copied).
- `TextList` is a **class**, not a plain object — it owns the invariant enforcement. The `items` array is private; `getItems()` returns a `ReadonlyArray`.
- `ListItem` is an **interface** (value type), not a class.
- `ItemId` uses a **branded type** pattern (intersection with `{ readonly __brand: 'ItemId' }`) — this is TypeScript-only, zero runtime overhead.
- `deleteSelected` must capture original indices **before** removing items. Example: items at indices [0, 2, 4] are selected; after removal the return value must reflect the pre-removal positions [0, 2, 4], not the post-removal positions.
- `restoreItem` is called in **reverse order** by `DeleteSelectedCommand.undo()` so that earlier indices remain valid during sequential re-insertions.
- Do NOT implement undo/command logic in this issue — that belongs in ISSUE-3.
- No `src/index.ts` yet — the public API barrel is added in ISSUE-4.
