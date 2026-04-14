## ISSUE-3: packages/core — Application Layer (Commands + CommandHistory)

**Feature**: text-list-manager
**Type**: feat
**Scope**: packages/core/src/application
**Priority**: P0
**Depends on**: ISSUE-2

### Description
Implement the Application layer of `packages/core`. This layer orchestrates domain operations via the **Command pattern**. Mutations are modelled as command objects — each command captures the minimal state needed to reverse itself and calls domain methods on `TextList`. `CommandHistory` manages the undo stack.

This is still pure TypeScript with no I/O — tests use `InMemoryListRepository` (created as a test utility in ISSUE-5).

**Directory structure:**
```
packages/core/src/application/
├── Command.ts
├── CommandHistory.ts
├── commands/
│   ├── AddItemCommand.ts
│   ├── DeleteSelectedCommand.ts
│   └── DeleteByIdCommand.ts
└── loadList.ts
```

**`Command` interface** (`Command.ts`):
```ts
import type { TextList } from '../domain/TextList';

export interface Command {
  execute(): TextList;
  undo(): TextList;
}
```

**`CommandHistory`** (`CommandHistory.ts`):
- Private `stack: Command[] = []`
- `MAX_HISTORY = 50` (oldest entry dropped when limit exceeded)
- `execute(command: Command): TextList` — calls `command.execute()`, pushes to stack, enforces cap, returns result
- `undo(): TextList | null` — pops and calls `command.undo()`; returns `null` if stack is empty
- `get canUndo(): boolean` — `stack.length > 0`

**`AddItemCommand`**:
```ts
export class AddItemCommand implements Command {
  private addedId: string;

  constructor(
    private list: TextList,
    private text: string,
    private repo: ListRepository
  ) {}

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
```

**`DeleteSelectedCommand`**:
```ts
export class DeleteSelectedCommand implements Command {
  private removed: { item: ListItem; index: number }[];

  constructor(private list: TextList, private repo: ListRepository) {}

  execute(): TextList {
    this.removed = this.list.deleteSelected();
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

**`DeleteByIdCommand`** — follows the same pattern as `DeleteSelectedCommand` but for a single item:
- Constructor takes `(list: TextList, id: string, repo: ListRepository)`
- `execute()`: calls `this.list.deleteById(id)`, stores `{ item, index }`, saves, returns list
- `undo()`: calls `this.list.restoreItem(item, index)`, saves, returns list

**`loadList`** (`loadList.ts`) — plain function, not a command (no undo semantics):
```ts
export function loadList(repo: ListRepository): TextList {
  return repo.load() ?? new TextList();
}
```

### Acceptance Criteria
- [x] `Command` interface exported from `application/Command.ts`
- [x] `CommandHistory` class exported from `application/CommandHistory.ts`
- [x] `CommandHistory.execute()` pushes command to stack and returns the result of `command.execute()`
- [x] `CommandHistory.undo()` returns `null` when stack is empty
- [x] `CommandHistory.undo()` calls `command.undo()` and removes command from stack
- [x] Stack is capped at 50 — calling `execute()` 51 times results in `canUndo === true` and only 50 commands in stack
- [x] `AddItemCommand.execute()` adds item and saves; `.undo()` removes it and saves
- [x] `DeleteSelectedCommand.execute()` removes selected items and saves; `.undo()` restores them in correct positions
- [x] `DeleteByIdCommand.execute()` removes item by id and saves; `.undo()` restores it at original position
- [x] `loadList(repo)` returns a new empty `TextList` when `repo.load()` returns `null`
- [x] `loadList(repo)` returns the loaded `TextList` when repository has data
- [x] TypeScript compiles with zero errors under `strict: true`

### Test Cases
Test file: `packages/core/src/application/CommandHistory.test.ts`
- `execute()` returns the post-mutation `TextList`
- `canUndo` is false initially, true after first `execute()`
- `undo()` returns `null` when stack empty
- `undo()` returns the restored list and decrements stack
- Stack cap: add 51 items via `AddItemCommand`, then call `undo()` 51 times — the 51st `undo()` returns `null` (cap enforced)

Test file: `packages/core/src/application/commands/AddItemCommand.test.ts`
- `execute()` adds item to list, saves to repo
- `undo()` removes the previously added item, saves to repo
- `execute()` throws if text is empty (propagates domain invariant)

Test file: `packages/core/src/application/commands/DeleteSelectedCommand.test.ts`
- `execute()` removes all selected items, saves
- `undo()` restores items at correct original positions (test with 2 selected items at non-contiguous indices)
- `execute()` throws if no items selected

Test file: `packages/core/src/application/commands/DeleteByIdCommand.test.ts`
- `execute()` removes item by id, saves
- `undo()` restores item at original position

Test file: `packages/core/src/application/loadList.test.ts`
- Returns new `TextList` when repo returns `null`
- Returns persisted `TextList` when repo has data

### Files Likely Affected
- `packages/core/src/application/Command.ts`
- `packages/core/src/application/CommandHistory.ts`
- `packages/core/src/application/commands/AddItemCommand.ts`
- `packages/core/src/application/commands/DeleteSelectedCommand.ts`
- `packages/core/src/application/commands/DeleteByIdCommand.ts`
- `packages/core/src/application/loadList.ts`

### Context & Constraints
- `AddItemCommand`, `DeleteSelectedCommand`, `DeleteByIdCommand` all take a **repository reference** as a constructor parameter — they call `repo.save()` after every mutation to persist state.
- Commands mutate the **same `TextList` instance** passed in — they do not clone it. The list is shared state; commands are the only mutation path.
- `SelectItemCommand` and `ToggleItemCommand` are intentionally **not implemented as commands** (they are selection UI state and not pushed to history). Selection is handled directly by `TextList.selectItem()` / `TextList.toggleItem()` calls in the app layer.
- `MAX_HISTORY = 50` is a module-level constant inside `CommandHistory.ts`.
- The `loadList` function (`loadList.ts`) is a plain function, not a command — it has no `undo()` and is not pushed to `CommandHistory`.
- Tests for this issue require `InMemoryListRepository` — implement it inline in each test file (or a shared `__tests__/InMemoryListRepository.ts` inside `packages/core/src`) since per-spec, test doubles are test infrastructure, not production code.
- All tests use **Vitest** — the test framework configured in ISSUE-5.
