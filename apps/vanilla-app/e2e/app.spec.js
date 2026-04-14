import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Navigate first so localStorage is accessible (same origin), then clear and reload
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// Helper to add item via modal
async function addItem(page, text) {
  await page.click(".action-bar__add-btn");
  await page.fill(".modal__input", text);
  await page.click(".modal__add-btn");
}

test("add, select, delete", async ({ page }) => {
  await addItem(page, "Buy milk");
  await expect(page.locator(".item-list__item")).toHaveCount(1);
  await page.click(".item-list__item");
  await page.click(".action-bar__delete-btn");
  await expect(page.locator(".item-list__item")).toHaveCount(0);
});

test("undo restores previous state", async ({ page }) => {
  await addItem(page, "Undo me");
  await page.click(".action-bar__undo-btn");
  await expect(page.locator(".item-list__item")).toHaveCount(0);
});
