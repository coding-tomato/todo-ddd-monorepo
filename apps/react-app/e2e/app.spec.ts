import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("add item, see it in list", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.getByPlaceholder(/enter item text/i).fill("Buy milk");
  await page.getByRole("button", { name: /^ADD$/i }).click();
  await expect(page.getByText("Buy milk")).toBeVisible();
});

test("select item, delete, confirm removal", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.getByPlaceholder(/enter item text/i).fill("Item A");
  await page.getByRole("button", { name: /^ADD$/i }).click();
  await page.getByText("Item A").click();
  await page.getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Item A")).not.toBeVisible();
});

test("undo restores previous state", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.getByPlaceholder(/enter item text/i).fill("Undo me");
  await page.getByRole("button", { name: /^ADD$/i }).click();
  await expect(page.getByText("Undo me")).toBeVisible();
  await page.getByRole("button", { name: /undo/i }).click();
  await expect(page.getByText("Undo me")).not.toBeVisible();
});

test("double-click deletes item", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.getByPlaceholder(/enter item text/i).fill("Double me");
  await page.getByRole("button", { name: /^ADD$/i }).click();
  await page.getByText("Double me").dblclick();
  await expect(page.getByText("Double me")).not.toBeVisible();
});

test("empty input blocked — Add button disabled", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  const addBtn = page.getByRole("button", { name: /^ADD$/i });
  await expect(addBtn).toBeDisabled();
  await page.getByPlaceholder(/enter item text/i).fill("x");
  await expect(addBtn).toBeEnabled();
  await page.getByPlaceholder(/enter item text/i).clear();
  await expect(addBtn).toBeDisabled();
});

test("multi-select: ctrl+click two items, delete both", async ({ page }) => {
  for (const text of ["Alpha", "Beta"]) {
    await page.getByRole("button", { name: /\+ add/i }).click();
    await page.getByPlaceholder(/enter item text/i).fill(text);
    await page.getByRole("button", { name: /^ADD$/i }).click();
  }
  await page.getByText("Alpha").click();
  await page.getByText("Beta").click({ modifiers: ["Control"] });
  await page.getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Alpha")).not.toBeVisible();
  await expect(page.getByText("Beta")).not.toBeVisible();
});
