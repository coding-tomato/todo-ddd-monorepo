import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Navigate first so localStorage is accessible (same origin), then clear and reload
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// Helper to add item via modal
async function addItem(page, text) {
  await page.click('.action-bar__add-btn');
  await page.fill('.modal__input', text);
  await page.click('.modal__add-btn');
}

test('add item, see it in list', async ({ page }) => {
  await addItem(page, 'Buy milk');
  await expect(page.locator('.item-list__item')).toHaveCount(1);
  await expect(page.locator('.item-list__item')).toContainText('Buy milk');
});

test('select item, delete, confirm removal', async ({ page }) => {
  await addItem(page, 'Item A');
  await page.click('.item-list__item');
  await page.click('.action-bar__delete-btn');
  await expect(page.locator('.item-list__item')).toHaveCount(0);
});

test('undo restores previous state', async ({ page }) => {
  await addItem(page, 'Undo me');
  await expect(page.locator('.item-list__item')).toHaveCount(1);
  await page.click('.action-bar__undo-btn');
  await expect(page.locator('.item-list__item')).toHaveCount(0);
});

test('double-click deletes item', async ({ page }) => {
  await addItem(page, 'Double me');
  await page.dblclick('.item-list__item');
  await expect(page.locator('.item-list__item')).toHaveCount(0);
});

test('empty input blocked — Add button disabled', async ({ page }) => {
  await page.click('.action-bar__add-btn');
  await expect(page.locator('.modal__add-btn')).toBeDisabled();
  await page.fill('.modal__input', 'x');
  await expect(page.locator('.modal__add-btn')).toBeEnabled();
  await page.fill('.modal__input', '');
  // trigger input event after clearing
  await page.locator('.modal__input').dispatchEvent('input');
  await expect(page.locator('.modal__add-btn')).toBeDisabled();
});

test('multi-select: ctrl+click two items, delete both', async ({ page }) => {
  await addItem(page, 'Alpha');
  await addItem(page, 'Beta');
  await page.click('.item-list__item:nth-child(1)');
  await page.click('.item-list__item:nth-child(2)', { modifiers: ['Control'] });
  await page.click('.action-bar__delete-btn');
  await expect(page.locator('.item-list__item')).toHaveCount(0);
});
