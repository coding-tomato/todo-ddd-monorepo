## ISSUE-9: apps/react-app — Styling (BEM CSS)

**Feature**: text-list-manager
**Type**: feat
**Scope**: apps/react-app/src/styles
**Priority**: P1
**Depends on**: ISSUE-8

### Description
Implement the visual design for the React app using plain CSS with BEM naming. The design reference is:
- `docs/design/todo_list.png` — main view
- `docs/design/modal_add_new_todo.png` — add item modal
- `docs/visual-design.md` — design tokens (colours, gradients)

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

**Main view layout:**
- Full-viewport background with `var(--gradient-bg)` (light blue/periwinkle)
- Centered white card with large `border-radius` (~16px), box-shadow using `var(--color-shadow)`
- Card max-width ~480px, centered horizontally and vertically
- Card has padding (~24px), contains heading + description at top, scrollable list in middle, action bar at bottom

**BEM class structure:**

```
.app                          — full-viewport wrapper (gradient bg)
.card                         — white centered card
.card__heading                — "This is a technical proof" h1/h2
.card__description            — short paragraph below heading
.item-list                    — scrollable list area (overflow-y: auto, max-height ~300px)
.item-list__item              — individual list row (padding, border-bottom)
.item-list__item--selected    — selected state (background: var(--color-primary), color: white)
.action-bar                   — bottom strip inside card, flex row, space-between
.action-bar__undo-btn         — circular icon-only outlined button (~40px)
.action-bar__delete-btn       — outlined secondary button, disabled style
.action-bar__add-btn          — pill-shaped solid blue button (background: var(--color-primary), color: white)
.modal-overlay                — fixed full-screen semi-transparent backdrop
.modal                        — white card centered over the main view
.modal__label                 — "Add item to list" text
.modal__input                 — full-width text input
.modal__actions               — right-aligned button row
.modal__add-btn               — pill-shaped solid blue (same style as .action-bar__add-btn)
.modal__cancel-btn            — pill-shaped outlined button
.error-banner                 — inline error message (yellow/red background, role=alert)
.error-boundary__fallback     — full-width error fallback message
```

**Button styles:**
- Pill-shaped: `border-radius: 9999px`, padding `8px 24px`
- Solid primary: `background: var(--color-primary)`, `color: white`, `border: none`
- Outlined: `background: transparent`, `border: 1px solid var(--color-primary)`, `color: var(--color-primary)`
- Circular undo button: `width: 40px`, `height: 40px`, `border-radius: 50%`, outlined style, icon inside (use a simple `↩` unicode char or an inline SVG)
- `disabled` state: `opacity: 0.4`, `cursor: not-allowed`

**Input style:**
- Full-width, `border: 1px solid var(--color-border)`, `border-radius: 8px`, padding `10px 14px`
- Focus ring: `outline: 2px solid var(--color-primary)`

**Modal overlay:**
- `position: fixed`, `inset: 0`, `background: rgba(0,0,0,0.3)`, `display: flex`, center child

### Acceptance Criteria
- [ ] `apps/react-app/src/styles/main.css` exists with CSS variables matching design tokens
- [ ] App renders with blue/periwinkle gradient background filling the viewport
- [ ] White card is centered on the page with border-radius and shadow
- [ ] List items have a bottom border; selected items have blue background + white text
- [ ] Undo button is circular and outlined
- [ ] Delete button is outlined; disabled state reduces opacity
- [ ] Add button is pill-shaped and solid blue
- [ ] Modal overlay darkens the background; modal card is centered
- [ ] Modal input is full-width with focus ring
- [ ] Modal ADD/CANCEL buttons are pill-shaped
- [ ] No CSS framework (Bootstrap, Tailwind, etc.) — plain CSS only
- [ ] All class names follow BEM convention as listed above

### Test Cases
No automated tests — visual verification via `pnpm --filter react-app dev` and comparing against `docs/design/` mockups.

### Files Likely Affected
- `apps/react-app/src/styles/main.css`
- `apps/react-app/src/main.tsx` (ensure CSS is imported)

### Context & Constraints
- This is **plain CSS with BEM** — no preprocessor (Sass/Less), no CSS Modules, no Tailwind.
- Design tokens are defined as CSS custom properties (`--color-*`) in `:root`.
- The component class names are defined in ISSUE-8 — this issue must match them exactly. Do not change component class names; only write the CSS rules.
- Both apps (react-app and vanilla-app) implement the same design independently — there is no shared stylesheet. The vanilla-app has its own copy (ISSUE-13).
- The design reference images are at `docs/design/todo_list.png` and `docs/design/modal_add_new_todo.png`. Implement pixel-approximate fidelity — exact pixel matching is not required, but visual structure (layout, hierarchy, colours) must match.
