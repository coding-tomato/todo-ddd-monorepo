import { describe, it, expect, afterEach, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { AppComponent } from '../components/AppComponent.js';
import { InMemoryListRepository } from '../__tests__/InMemoryListRepository.js';

function setup() {
  // handleError looks for #app in the document
  const $app = document.createElement('div');
  $app.id = 'app';
  document.body.appendChild($app);

  const $root = document.createElement('div');
  $app.appendChild($root);

  const repo = new InMemoryListRepository();
  const app = new AppComponent($root, repo);
  return { $root, $app, repo, app };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function addItem($root, text) {
  $root.querySelector('.action-bar__add-btn').click();
  const input = $root.querySelector('.modal__input');
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  $root.querySelector('.modal__add-btn').click();
}

describe('AppComponent integration tests', () => {
  it('1. initial render — item-list empty, delete and undo disabled', () => {
    const { $root } = setup();

    const itemList = $root.querySelector('.item-list');
    expect(itemList.children.length).toBe(0);

    const deleteBtn = $root.querySelector('.action-bar__delete-btn');
    expect(deleteBtn.disabled).toBe(true);

    const undoBtn = $root.querySelector('.action-bar__undo-btn');
    expect(undoBtn.disabled).toBe(true);
  });

  it('2. add item — item appears in list, modal hidden', () => {
    const { $root } = setup();

    addItem($root, 'Hello world');

    const items = $root.querySelectorAll('.item-list li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Hello world');

    const overlay = $root.querySelector('.modal-overlay');
    expect(overlay.classList.contains('modal-overlay--hidden')).toBe(true);
  });

  it('3. ADD button disabled when input empty, enabled when input has value', () => {
    const { $root } = setup();

    $root.querySelector('.action-bar__add-btn').click();

    const addBtn = $root.querySelector('.modal__add-btn');
    expect(addBtn.disabled).toBe(true);

    const input = $root.querySelector('.modal__input');
    input.value = 'some text';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(addBtn.disabled).toBe(false);
  });

  it('4. select item — li gets selected class, delete button enabled', () => {
    const { $root } = setup();

    addItem($root, 'Item A');

    $root.querySelector('.item-list li').click();

    // Re-query after re-render (render() replaces DOM nodes)
    const li = $root.querySelector('.item-list li');
    expect(li.classList.contains('item-list__item--selected')).toBe(true);

    const deleteBtn = $root.querySelector('.action-bar__delete-btn');
    expect(deleteBtn.disabled).toBe(false);
  });

  it('5. multi-select — ctrl+click selects additional item', () => {
    const { $root } = setup();

    addItem($root, 'Item A');
    addItem($root, 'Item B');

    $root.querySelectorAll('.item-list li')[0].click();
    // Re-query after re-render triggered by first click
    $root.querySelectorAll('.item-list li')[1].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));

    // Re-query after re-render (render() replaces DOM nodes)
    const [firstLi, secondLi] = $root.querySelectorAll('.item-list li');
    expect(firstLi.classList.contains('item-list__item--selected')).toBe(true);
    expect(secondLi.classList.contains('item-list__item--selected')).toBe(true);
  });

  it('6. delete selected — removes selected item, keeps others', () => {
    const { $root } = setup();

    addItem($root, 'Item A');
    addItem($root, 'Item B');

    const firstLi = $root.querySelector('.item-list li');
    firstLi.click();

    $root.querySelector('.action-bar__delete-btn').click();

    const remaining = $root.querySelectorAll('.item-list li');
    expect(remaining.length).toBe(1);
    expect(remaining[0].textContent).toContain('Item B');
  });

  it('7. undo add — item is removed after undo', () => {
    const { $root } = setup();

    addItem($root, 'Item A');
    expect($root.querySelectorAll('.item-list li').length).toBe(1);

    $root.querySelector('.action-bar__undo-btn').click();

    expect($root.querySelectorAll('.item-list li').length).toBe(0);
  });

  it('8. undo delete — deleted item is restored after undo', () => {
    const { $root } = setup();

    addItem($root, 'Item A');

    const li = $root.querySelector('.item-list li');
    li.click();
    $root.querySelector('.action-bar__delete-btn').click();
    expect($root.querySelectorAll('.item-list li').length).toBe(0);

    $root.querySelector('.action-bar__undo-btn').click();

    const restored = $root.querySelectorAll('.item-list li');
    expect(restored.length).toBe(1);
    expect(restored[0].textContent).toContain('Item A');
  });

  it('9. double-click delete — dblclick on li removes it', () => {
    const { $root } = setup();

    addItem($root, 'Item A');
    expect($root.querySelectorAll('.item-list li').length).toBe(1);

    const li = $root.querySelector('.item-list li');
    li.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect($root.querySelectorAll('.item-list li').length).toBe(0);
  });

  it('10. cancel modal — modal hidden, no item added', () => {
    const { $root } = setup();

    $root.querySelector('.action-bar__add-btn').click();

    const input = $root.querySelector('.modal__input');
    input.value = 'Some text';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    $root.querySelector('.modal__cancel-btn').click();

    const overlay = $root.querySelector('.modal-overlay');
    expect(overlay.classList.contains('modal-overlay--hidden')).toBe(true);

    expect($root.querySelectorAll('.item-list li').length).toBe(0);
  });

  it('11. error banner — appears with role=alert when repo.save throws', () => {
    const { $root, repo } = setup();

    vi.spyOn(repo, 'save').mockImplementation(() => {
      throw new Error('fail');
    });

    addItem($root, 'Item A');

    const banner = document.querySelector('.error-banner');
    expect(banner).not.toBeNull();
    expect(banner.getAttribute('role')).toBe('alert');
  });
});

describe('AppComponent accessibility', () => {
  it('passes axe on initial empty state', async () => {
    const { $root } = setup();
    const results = await axe($root);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with items in the list', async () => {
    const { $root } = setup();
    addItem($root, 'Buy milk');
    addItem($root, 'Walk the dog');
    const results = await axe($root);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with modal open', async () => {
    const { $root } = setup();
    $root.querySelector('.action-bar__add-btn').click();
    const results = await axe($root);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with error banner visible', async () => {
    const { $root, repo } = setup();
    vi.spyOn(repo, 'save').mockImplementation(() => { throw new Error('fail'); });
    addItem($root, 'Item A');
    const results = await axe($root);
    expect(results).toHaveNoViolations();
  });
});
