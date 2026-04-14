## ISSUE-12: apps/vanilla-app — Components and Wiring

**Feature**: text-list-manager
**Type**: feat
**Scope**: apps/vanilla-app/src/components + main.js
**Priority**: P0
**Depends on**: ISSUE-11

### Description
Implement the vanilla JS component model. Components extend a shared `Component` base class. `AppComponent` holds the current `TextList` and `CommandHistory`, calls use cases on user actions, and calls `render(list)` on all sub-components after every mutation.

**Full directory structure:**
```
apps/vanilla-app/src/
├── main.js
├── errorHandler.js
└── components/
    ├── Component.js
    ├── AppComponent.js
    ├── ItemListComponent.js
    ├── ActionBarComponent.js
    └── AddItemModal.js
```

---

**`Component.js`** — base class:
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

---

**`errorHandler.js`**:
```js
export function handleError(err) {
  const existing = document.querySelector('.error-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.setAttribute('role', 'alert');
  banner.textContent = err instanceof Error ? err.message : 'Something went wrong, please try again';
  document.querySelector('#app').prepend(banner);
  setTimeout(() => banner.remove(), 4000);
}

export function withErrorHandling(fn) {
  return (...args) => {
    try {
      fn(...args);
    } catch (err) {
      handleError(err);
    }
  };
}
```

Global fallback in `main.js`:
```js
window.onerror = (msg, src, line, col, err) => handleError(err || new Error(msg));
window.onunhandledrejection = (e) => handleError(e.reason);
```

---

**`ItemListComponent.js`** — renders `<ul>` with one `<li>` per item:
```js
export class ItemListComponent extends Component {
  constructor($root, { onSelect, onToggle, onDelete }) {
    super($root);
    this._onSelect = onSelect;
    this._onToggle = onToggle;
    this._onDelete = onDelete;
  }
  render(list) {
    this.$root.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'item-list';
    list.getItems().forEach(item => {
      const li = document.createElement('li');
      li.className = 'item-list__item' + (item.isSelected ? ' item-list__item--selected' : '');
      li.textContent = item.text;
      li.dataset.id = item.id;
      li.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          this._onToggle(item.id);
        } else {
          this._onSelect(item.id);
        }
      });
      li.addEventListener('dblclick', () => this._onDelete(item.id));
      ul.appendChild(li);
    });
    this.$root.appendChild(ul);
  }
}
```

---

**`ActionBarComponent.js`**:
```js
export class ActionBarComponent extends Component {
  constructor($root, { onUndo, onDelete, onOpenAdd }) {
    super($root);
    this.$ = {
      undoBtn: $root.querySelector('.action-bar__undo-btn'),
      deleteBtn: $root.querySelector('.action-bar__delete-btn'),
      addBtn: $root.querySelector('.action-bar__add-btn'),
    };
    this.$.undoBtn.addEventListener('click', withErrorHandling(onUndo));
    this.$.deleteBtn.addEventListener('click', withErrorHandling(onDelete));
    this.$.addBtn.addEventListener('click', onOpenAdd);
  }
  render(list, canUndo) {
    const hasSelection = list.getItems().some(i => i.isSelected);
    this.$.undoBtn.disabled = !canUndo;
    this.$.deleteBtn.disabled = !hasSelection;
  }
}
```

Note: `render(list, canUndo)` signature differs slightly from base — `AppComponent` passes both.

---

**`AddItemModal.js`**:
```js
export class AddItemModal extends Component {
  constructor($root, { onAdd, onClose }) {
    super($root);
    this.$ = {
      input: $root.querySelector('.modal__input'),
      addBtn: $root.querySelector('.modal__add-btn'),
      cancelBtn: $root.querySelector('.modal__cancel-btn'),
    };
    this._onAdd = onAdd;
    this._onClose = onClose;
    this._bindEvents();
  }
  _bindEvents() {
    this.$.addBtn.addEventListener('click', withErrorHandling(() => {
      const text = this.$.input.value.trim();
      if (!text) return;
      this._onAdd(text);
      this.$.input.value = '';
      this._onClose();
    }));
    this.$.cancelBtn.addEventListener('click', () => this._onClose());
    this.$.input.addEventListener('input', () => {
      this.$.addBtn.disabled = !this.$.input.value.trim();
    });
    this.$.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.$.input.value.trim()) {
        withErrorHandling(() => {
          this._onAdd(this.$.input.value.trim());
          this.$.input.value = '';
          this._onClose();
        })();
      }
    });
  }
  show() {
    this.$root.classList.remove('modal-overlay--hidden');
    this.$.input.focus();
    this.$.addBtn.disabled = true;
  }
  hide() {
    this.$root.classList.add('modal-overlay--hidden');
    this.$.input.value = '';
  }
}
```

---

**`AppComponent.js`** — root coordinator. Holds `TextList` + `CommandHistory`, updates all sub-components after every mutation:
```js
import { LocalStorageListRepository, CommandHistory, loadList,
         AddItemCommand, DeleteSelectedCommand, DeleteByIdCommand } from '@repo/core';
import { ItemListComponent } from './ItemListComponent.js';
import { ActionBarComponent } from './ActionBarComponent.js';
import { AddItemModal } from './AddItemModal.js';
import { withErrorHandling } from '../errorHandler.js';

export class AppComponent extends Component {
  constructor($root) {
    super($root);
    this._repo = new LocalStorageListRepository();
    this._history = new CommandHistory();
    this._list = loadList(this._repo);
    this._initDOM();
    this._initComponents();
    this._renderAll();
  }
  _initDOM() {
    this.$root.innerHTML = `
      <div class="card">
        <h1 class="card__heading">This is a technical proof</h1>
        <p class="card__description">A Text List Manager built with DDD and clean architecture.</p>
        <div class="item-list-container"></div>
        <div class="action-bar">
          <button class="action-bar__undo-btn" aria-label="Undo">↩</button>
          <button class="action-bar__delete-btn">DELETE</button>
          <button class="action-bar__add-btn">ADD</button>
        </div>
      </div>
      <div class="modal-overlay modal-overlay--hidden">
        <div class="modal">
          <label class="modal__label">Add item to list</label>
          <input class="modal__input" type="text" placeholder="Type the text here…" />
          <div class="modal__actions">
            <button class="modal__add-btn" disabled>ADD</button>
            <button class="modal__cancel-btn">CANCEL</button>
          </div>
        </div>
      </div>
    `;
  }
  _initComponents() {
    this._itemList = new ItemListComponent(
      this.$root.querySelector('.item-list-container'),
      {
        onSelect: withErrorHandling((id) => { this._list.selectItem(id); this._renderAll(); }),
        onToggle: withErrorHandling((id) => { this._list.toggleItem(id); this._renderAll(); }),
        onDelete: withErrorHandling((id) => {
          this._list = this._history.execute(new DeleteByIdCommand(this._list, id, this._repo));
          this._renderAll();
        }),
      }
    );
    this._actionBar = new ActionBarComponent(
      this.$root.querySelector('.action-bar'),
      {
        onUndo: () => {
          const result = this._history.undo();
          if (result) { this._list = result; this._renderAll(); }
        },
        onDelete: () => {
          this._list = this._history.execute(new DeleteSelectedCommand(this._list, this._repo));
          this._renderAll();
        },
        onOpenAdd: () => this._modal.show(),
      }
    );
    this._modal = new AddItemModal(
      this.$root.querySelector('.modal-overlay'),
      {
        onAdd: (text) => {
          this._list = this._history.execute(new AddItemCommand(this._list, text, this._repo));
          this._renderAll();
        },
        onClose: () => this._modal.hide(),
      }
    );
  }
  _renderAll() {
    this._itemList.render(this._list);
    this._actionBar.render(this._list, this._history.canUndo);
  }
}
```

---

**`main.js`** — bootstrap:
```js
import { AppComponent } from './components/AppComponent.js';
import { handleError } from './errorHandler.js';
import './styles/main.css';

window.onerror = (msg, src, line, col, err) => handleError(err || new Error(String(msg)));
window.onunhandledrejection = (e) => handleError(e.reason);

const $app = document.querySelector('#app');
new AppComponent($app);
```

### Acceptance Criteria
- [ ] `Component.js` base class exists with `$root`, `$`, `_bindEvents()`, `render()`
- [ ] `ItemListComponent` renders `<ul>` with `<li>` elements per item
- [ ] Click on item calls `onSelect`; Ctrl+click calls `onToggle`
- [ ] Double-click calls `onDelete`
- [ ] Selected items have `item-list__item--selected` class
- [ ] `ActionBarComponent` disables Undo when `!canUndo`, disables Delete when no selection
- [ ] `AddItemModal.show()` makes overlay visible and focuses input
- [ ] `AddItemModal` ADD button is disabled when input is empty
- [ ] Submitting modal adds item and hides modal
- [ ] CANCEL hides modal without adding
- [ ] `AppComponent` renders full HTML structure in `_initDOM()`
- [ ] All mutations go through `CommandHistory`
- [ ] `errorHandler.js` renders error banner with `role="alert"` and auto-removes after 4s
- [ ] `window.onerror` and `window.onunhandledrejection` are wired in `main.js`
- [ ] `pnpm --filter vanilla-app dev` renders the full working app in the browser

### Test Cases
Not covered here — component tests are written in ISSUE-14.

### Files Likely Affected
- `apps/vanilla-app/src/main.js`
- `apps/vanilla-app/src/errorHandler.js`
- `apps/vanilla-app/src/components/Component.js`
- `apps/vanilla-app/src/components/AppComponent.js`
- `apps/vanilla-app/src/components/ItemListComponent.js`
- `apps/vanilla-app/src/components/ActionBarComponent.js`
- `apps/vanilla-app/src/components/AddItemModal.js`

### Context & Constraints
- **No TypeScript** — all files are plain `.js` ES modules.
- `AppComponent` uses a **full re-render on every mutation** strategy — `_renderAll()` re-renders the entire list on every change. Simple and predictable.
- The modal is shown/hidden via CSS class (`modal-overlay--hidden`) rather than removing from DOM — this keeps the DOM structure stable and avoids re-binding events.
- `withErrorHandling` wraps all use case calls to catch domain invariant throws and display error banners.
- `@repo/core` is imported as compiled ESM — the import path is `'@repo/core'` (resolved via pnpm workspace + Vite alias to `packages/core/dist/index.js`).
- `AppComponent` is the **composition root** — it instantiates `LocalStorageListRepository`, `CommandHistory`, and calls `loadList`. Sub-components receive callbacks, not the repo or history directly.
- The `withErrorHandling` import in `ActionBarComponent.js` must be imported from `'../errorHandler.js'`.
