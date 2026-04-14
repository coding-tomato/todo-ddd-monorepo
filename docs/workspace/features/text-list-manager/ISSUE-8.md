## ISSUE-8: apps/react-app — Components

**Feature**: text-list-manager
**Type**: feat
**Scope**: apps/react-app/src/components
**Priority**: P0
**Depends on**: ISSUE-7

### Description
Implement the React component tree. Components are thin — they receive data and handlers as props and render. All business logic lives in `useTextList` (ISSUE-7). Components do not import from `@repo/core` directly.

**Component tree:**
```
App
├── ErrorBoundary          # class component wrapping entire tree
│   ├── ItemList
│   │   └── ListItemRow[]
│   ├── ActionBar
│   └── AddItemModal       # conditionally rendered (boolean state in App)
```

---

**`App.tsx`** — composition root:
- Instantiates `LocalStorageListRepository` (once, via `useMemo` or `useRef` to avoid recreation on re-renders)
- Calls `useTextList(repo)`
- Manages `isModalOpen: boolean` state
- Renders `ErrorBoundary` wrapping `ItemList`, `ActionBar`, and `AddItemModal`
- Shows inline error banner if `error !== null`

```tsx
// Rough shape:
export function App() {
  const repo = useMemo(() => new LocalStorageListRepository(), []);
  const { list, error, canUndo, handleAddItem, handleDeleteSelected,
          handleDeleteById, handleSelectItem, handleToggleItem, handleUndo } = useTextList(repo);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ErrorBoundary>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <ItemList
        items={list.getItems()}
        onSelect={handleSelectItem}
        onDelete={handleDeleteById}
      />
      <ActionBar
        canUndo={canUndo}
        hasSelection={list.getItems().some(i => i.isSelected)}
        onUndo={handleUndo}
        onDeleteSelected={handleDeleteSelected}
        onOpenAdd={() => setIsModalOpen(true)}
      />
      {isModalOpen && (
        <AddItemModal
          onAdd={(text) => { handleAddItem(text); setIsModalOpen(false); }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </ErrorBoundary>
  );
}
```

**`ItemList.tsx`** — renders `ListItemRow` for each item:
```tsx
interface ItemListProps {
  items: ReadonlyArray<ListItem>;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}
```
Renders a scrollable `<ul>` with one `<li>` per item via `ListItemRow`.

**`ListItemRow.tsx`**:
```tsx
interface ListItemRowProps {
  item: ListItem;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}
```
- `onClick` → `onSelect(item.id)` (single select)
- `onDoubleClick` → `onDelete(item.id)`
- Applies `selected` BEM modifier class when `item.isSelected`

**Multi-select:** Ctrl+click (or Cmd+click on Mac) should call `handleToggleItem` instead of `handleSelectItem`. In `ListItemRow`:
```tsx
onClick={(e) => {
  if (e.ctrlKey || e.metaKey) {
    onToggle(item.id);
  } else {
    onSelect(item.id);
  }
}}
```
This means `ItemList` and `ListItemRow` also need `onToggle` prop.

**`ActionBar.tsx`**:
```tsx
interface ActionBarProps {
  canUndo: boolean;
  hasSelection: boolean;
  onUndo: () => void;
  onDeleteSelected: () => void;
  onOpenAdd: () => void;
}
```
- Undo button: circular icon-only, `disabled={!canUndo}`, BEM class `action-bar__undo-btn`
- Delete button: outlined secondary style, `disabled={!hasSelection}`, BEM class `action-bar__delete-btn`
- Add button: pill-shaped solid-blue, BEM class `action-bar__add-btn`

**`AddItemModal.tsx`**:
```tsx
interface AddItemModalProps {
  onAdd: (text: string) => void;
  onClose: () => void;
}
```
- Owns local `inputValue: string` state
- Add button disabled when `inputValue.trim() === ''`
- Submit on ADD button click: calls `onAdd(inputValue.trim())` then clears input
- CANCEL button calls `onClose()`
- Submit on Enter key in input field

**`ErrorBoundary.tsx`** — class component:
```tsx
interface State { hasError: boolean; }
class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error(error, info); }
  render() {
    if (this.state.hasError) {
      return <div className="error-boundary__fallback">Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
```

**`apps/react-app/src/main.tsx`** — replace placeholder with real app:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles/main.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### Acceptance Criteria
- [ ] `App` component renders without errors in the browser
- [ ] `ItemList` renders all items from `list.getItems()`
- [ ] Clicking an item calls `handleSelectItem` (single select)
- [ ] Ctrl+click calls `handleToggleItem` (multi-select)
- [ ] Double-clicking an item calls `handleDeleteById`
- [ ] Selected items receive a CSS modifier class (e.g. `list-item-row--selected`)
- [ ] Delete button is disabled when no items are selected
- [ ] Undo button is disabled when `!canUndo`
- [ ] Clicking ADD button opens `AddItemModal`
- [ ] Modal ADD button is disabled when input is empty
- [ ] Submitting modal calls `handleAddItem` and closes modal
- [ ] CANCEL closes modal without adding
- [ ] Error banner appears when `error !== null` and has `role="alert"`
- [ ] `ErrorBoundary` renders fallback UI when a child throws during render
- [ ] TypeScript compiles with zero errors

### Test Cases
Not covered here — all component tests are integration tests written in ISSUE-10. This issue only implements the component source files.

### Files Likely Affected
- `apps/react-app/src/components/App.tsx`
- `apps/react-app/src/components/ItemList.tsx`
- `apps/react-app/src/components/ListItemRow.tsx`
- `apps/react-app/src/components/ActionBar.tsx`
- `apps/react-app/src/components/AddItemModal.tsx`
- `apps/react-app/src/components/ErrorBoundary.tsx`
- `apps/react-app/src/main.tsx`

### Context & Constraints
- `ListItem` type is imported from `@repo/core` — props typed with it.
- `LocalStorageListRepository` is imported from `@repo/core` and instantiated in `App` with `useMemo` to avoid recreation each render.
- Components are **functional** except `ErrorBoundary` which must be a class component (React's API constraint for `getDerivedStateFromError`).
- `AddItemModal` is conditionally rendered (not CSS-hidden) — it unmounts on close, resetting its local input state automatically.
- Event handler errors (thrown by use cases) are caught in `useTextList` and surfaced as `error` state — they do NOT bubble up to `ErrorBoundary`. Only render-time errors hit the boundary.
- CSS class names use **BEM** convention (see ISSUE-9 for full class list). Components must emit the right BEM classes so ISSUE-9 styling works without changes to the component files.
- The main card/layout wrapper lives in `App.tsx` — a `<div className="app">` containing `<div className="card">` (the white centered card from the design mockup).
