## ISSUE-13: apps/vanilla-app — Styling (BEM CSS)

**Feature**: text-list-manager
**Type**: feat
**Scope**: apps/vanilla-app/src/styles
**Priority**: P1
**Depends on**: ISSUE-12

### Description
Implement the visual design for the vanilla app using plain CSS with BEM naming. The design is identical to the React app (ISSUE-9) — same mockups, same tokens, same BEM class names.

**Design reference:**
- `docs/design/todo_list.png` — main view
- `docs/design/modal_add_new_todo.png` — add item modal
- `docs/visual-design.md` — design tokens

**Design tokens** (from `docs/visual-design.md`):
```css
:root {
  --color-primary: #324BFF;
  --color-surface: #FFFFFF;
  --color-background: #F7F7F7;
  --color-border: #CCCCCC;
  --color-text: #333333;
  --color-shadow: #0000001F;
  --gradient-end: #C2E9FB;
  --gradient-bg: linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%);
}
```

**BEM class structure** (same as react-app — must match exactly what `AppComponent._initDOM()` outputs in ISSUE-12):

```
.app                          — full-viewport wrapper (gradient bg) — on #app element itself, or inner wrapper
.card                         — white centered card
.card__heading                — h1 heading
.card__description            — description paragraph
.item-list                    — <ul> scrollable list area
.item-list__item              — <li> individual row
.item-list__item--selected    — selected state modifier
.action-bar                   — bottom action bar flex row
.action-bar__undo-btn         — circular outlined undo button
.action-bar__delete-btn       — outlined secondary delete button
.action-bar__add-btn          — pill solid-blue add button
.modal-overlay                — fixed full-screen backdrop
.modal-overlay--hidden        — display: none modifier (used to show/hide modal without DOM removal)
.modal                        — white modal card
.modal__label                 — "Add item to list" label
.modal__input                 — full-width text input
.modal__actions               — right-aligned button row
.modal__add-btn               — pill solid-blue button
.modal__cancel-btn            — pill outlined button
.error-banner                 — error message strip
```

**Layout:**
- `body` / `#app`: `min-height: 100vh`, `background: var(--gradient-bg)`, `display: flex`, `align-items: center`, `justify-content: center`
- `.card`: `background: var(--color-surface)`, `border-radius: 16px`, `box-shadow: 0 4px 24px var(--color-shadow)`, `padding: 24px`, `width: 100%`, `max-width: 480px`
- `.item-list`: `list-style: none`, `padding: 0`, `margin: 16px 0`, `max-height: 320px`, `overflow-y: auto`
- `.item-list__item`: `padding: 12px 16px`, `border-bottom: 1px solid var(--color-border)`, `cursor: pointer`, `user-select: none`, `color: var(--color-text)`
- `.item-list__item--selected`: `background: var(--color-primary)`, `color: white`, `border-bottom-color: transparent`

**Button styles:**
```css
button {
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 0.15s;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.action-bar__add-btn, .modal__add-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 8px 24px;
}
.action-bar__delete-btn, .modal__cancel-btn {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
  border-radius: 9999px;
  padding: 8px 24px;
}
.action-bar__undo-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: 1.5px solid var(--color-primary);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
```

**Modal:**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-overlay--hidden {
  display: none;
}
.modal {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 24px var(--color-shadow);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal__input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  box-sizing: border-box;
}
.modal__input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

**Action bar:**
```css
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  gap: 8px;
}
```

**Error banner:**
```css
.error-banner {
  background: #FFF3CD;
  border: 1px solid #FFEAA7;
  color: #856404;
  padding: 10px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}
```

**CSS reset/base:**
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; color: var(--color-text); }
```

### Acceptance Criteria
- [ ] `apps/vanilla-app/src/styles/main.css` exists with CSS variables matching design tokens
- [ ] Gradient background fills the viewport
- [ ] Card is centered, white, with border-radius and shadow
- [ ] Selected items show blue background + white text
- [ ] Undo button is circular outlined; disabled state reduces opacity
- [ ] Delete button is outlined; ADD button is solid blue pill
- [ ] Modal overlay darkens background; modal is centered white card
- [ ] `modal-overlay--hidden` hides the modal
- [ ] Input has focus ring
- [ ] No CSS framework — plain CSS only
- [ ] BEM class names match exactly what ISSUE-12 components emit

### Test Cases
No automated tests — visual verification via `pnpm --filter vanilla-app dev`.

### Files Likely Affected
- `apps/vanilla-app/src/styles/main.css`

### Context & Constraints
- This stylesheet is an **independent copy** of the react-app styles — same design, not shared code. The two apps have different asset pipelines.
- CSS class names must match exactly what `AppComponent._initDOM()` and the component `render()` methods output (defined in ISSUE-12).
- `modal-overlay--hidden` uses `display: none` (not `visibility: hidden`) to fully remove from accessibility tree when closed.
- The `#app` div or a wrapper inside it should receive the gradient background — check how `AppComponent` structures the DOM.
