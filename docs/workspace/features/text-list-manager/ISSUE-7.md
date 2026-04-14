## ISSUE-7: apps/react-app — useTextList Hook

**Feature**: text-list-manager
**Type**: feat
**Scope**: apps/react-app/src/hooks
**Priority**: P0
**Depends on**: ISSUE-6

### Description
Implement the `useTextList(repo: ListRepository)` hook. This is the single place where `TextList` state lives in the React app. It encapsulates `useState<TextList>`, `CommandHistory`, and all handler functions. Components receive handlers as props and render list data — they contain no business logic.

**File:** `apps/react-app/src/hooks/useTextList.ts`

```ts
import { useState, useCallback } from 'react';
import {
  TextList,
  CommandHistory,
  AddItemCommand,
  DeleteSelectedCommand,
  DeleteByIdCommand,
  loadList,
} from '@repo/core';
import type { ListRepository } from '@repo/core';

export function useTextList(repo: ListRepository) {
  const [list, setList] = useState<TextList>(() => loadList(repo));
  const [history] = useState(() => new CommandHistory());
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleAddItem = useCallback((text: string) => {
    try {
      const result = history.execute(new AddItemCommand(list, text, repo));
      setList(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    }
  }, [list, history, repo]);

  const handleDeleteSelected = useCallback(() => {
    try {
      const result = history.execute(new DeleteSelectedCommand(list, repo));
      setList(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    }
  }, [list, history, repo]);

  const handleDeleteById = useCallback((id: string) => {
    try {
      const result = history.execute(new DeleteByIdCommand(list, id, repo));
      setList(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    }
  }, [list, history, repo]);

  const handleSelectItem = useCallback((id: string) => {
    list.selectItem(id);
    setList(list); // trigger re-render with same reference won't work — create new TextList or use a forceUpdate trick
  }, [list]);

  const handleToggleItem = useCallback((id: string) => {
    list.toggleItem(id);
    setList(list);
  }, [list]);

  const handleUndo = useCallback(() => {
    try {
      const result = history.undo();
      if (result) {
        setList(result);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    }
  }, [history]);

  return {
    list,
    error,
    canUndo: history.canUndo,
    handleAddItem,
    handleDeleteSelected,
    handleDeleteById,
    handleSelectItem,
    handleToggleItem,
    handleUndo,
    clearError,
  };
}
```

**Important note on `selectItem` / `toggleItem`:** These methods mutate `TextList` in place (changing `isSelected` on items). Since React's `useState` triggers re-render only on reference change, calling `setList(list)` with the same object won't re-render. Two valid solutions:
1. Create a shallow copy: `setList(Object.assign(Object.create(Object.getPrototypeOf(list)), list))` — fragile if `TextList` has private fields
2. Add a `clone()` method to `TextList` (preferred) that returns a new instance with the same items
3. Keep a counter `const [, forceUpdate] = useReducer(x => x + 1, 0)` and call it after selection mutations

Pick the approach that keeps `TextList` as the single source of truth without leaking implementation details. Option 3 (forceUpdate) is clean and requires no changes to the domain model.

### Acceptance Criteria
- [ ] `useTextList` hook exists at `apps/react-app/src/hooks/useTextList.ts`
- [ ] Hook initialises state from `loadList(repo)` on first render
- [ ] `handleAddItem` calls `AddItemCommand` and updates `list` state
- [ ] `handleDeleteSelected` calls `DeleteSelectedCommand` and updates `list` state
- [ ] `handleDeleteById` calls `DeleteByIdCommand` and updates `list` state
- [ ] `handleSelectItem` causes a re-render showing the updated selection
- [ ] `handleToggleItem` causes a re-render showing the updated selection
- [ ] `handleUndo` calls `history.undo()` and updates `list` state; no-op if `!canUndo`
- [ ] `error` is set when a domain invariant throws (e.g. add empty text)
- [ ] `error` is cleared on next successful operation
- [ ] `canUndo` reflects `history.canUndo`
- [ ] TypeScript compiles with zero errors

### Test Cases
The hook is NOT tested in isolation (no `renderHook` tests). Its behaviour is covered by the integration tests in ISSUE-10 which render the full component tree. This is intentional — per Testing Trophy, integration tests are the widest layer.

### Files Likely Affected
- `apps/react-app/src/hooks/useTextList.ts`

### Context & Constraints
- State management is **plain `useState`** — no Zustand, no Redux, no Context API for global state. The hook is instantiated in `App.tsx` and handlers are passed as props.
- `CommandHistory` is instantiated inside `useState(() => new CommandHistory())` so it persists across re-renders without triggering them.
- **Do not test this hook in isolation** — testing `useTextList` via `renderHook` in a vacuum does not give better coverage than the component integration tests. Follow the Testing Trophy: test through the rendered UI.
- `repo` is passed in as a constructor parameter (dependency injection) — `App.tsx` instantiates `LocalStorageListRepository` and passes it to the hook. This keeps the hook testable with `InMemoryListRepository` in tests.
- Selection handlers (`handleSelectItem`, `handleToggleItem`) are NOT pushed to `CommandHistory` — selection is transient UI state.
