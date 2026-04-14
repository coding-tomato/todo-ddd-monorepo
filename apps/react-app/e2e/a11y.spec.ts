import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";

const _require = createRequire(import.meta.url);
const axeSource = readFileSync(_require.resolve("axe-core"), "utf-8");

async function runAxe(page: Parameters<Parameters<typeof test>[1]>[0]["page"]) {
  await page.evaluate(axeSource);
  return page.evaluate(async () => {
    const axeWindow = window as unknown as {
      axe: {
        run: () => Promise<{
          violations: { id: string; description: string }[];
        }>;
      };
    };
    const results = await axeWindow.axe.run();
    return results.violations;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// --- Automated axe scans ---

test("no axe violations on initial page load", async ({ page }) => {
  const violations = await runAxe(page);
  expect(violations).toEqual([]);
});

test("no axe violations with modal open", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  const violations = await runAxe(page);
  expect(violations).toEqual([]);
});

test("no axe violations with items in the list", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.getByPlaceholder(/enter item text/i).fill("Test item");
  await page.getByRole("button", { name: /^ADD$/i }).click();
  const violations = await runAxe(page);
  expect(violations).toEqual([]);
});

// --- Modal focus management ---

test("focus moves into the modal input when the modal opens", async ({
  page,
}) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const focusedTag = await page.evaluate(() =>
    document.activeElement?.tagName.toLowerCase()
  );
  expect(focusedTag).toBe("input");
});

test("focus returns to + ADD button when modal is closed via Cancel", async ({
  page,
}) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.getByRole("button", { name: /cancel/i }).click();
  const focusedText = await page.evaluate(() =>
    (document.activeElement as HTMLElement)?.textContent?.trim()
  );
  expect(focusedText).toBe("+ ADD");
});

test("focus returns to + ADD button when modal is closed via Escape", async ({
  page,
}) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.keyboard.press("Escape");
  const focusedText = await page.evaluate(() =>
    (document.activeElement as HTMLElement)?.textContent?.trim()
  );
  expect(focusedText).toBe("+ ADD");
});

// --- Modal focus trap ---

test("Tab key cycles focus within the modal and does not escape to the page", async ({
  page,
}) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.keyboard.type("x"); // enable the ADD button so all 3 elements are focusable
  // Tab through: input → ADD → CANCEL → should wrap back into the modal, not escape
  for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
  const isWithinDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog?.contains(document.activeElement) ?? false;
  });
  expect(isWithinDialog).toBe(true);
});

test("Shift+Tab from the modal input wraps focus to the last element in the modal", async ({
  page,
}) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.keyboard.type("x"); // enable ADD button so CANCEL is not the last focusable
  await page.keyboard.press("Shift+Tab");
  const isWithinDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog?.contains(document.activeElement) ?? false;
  });
  expect(isWithinDialog).toBe(true);
});

// --- Keyboard navigation ---

test("Escape key closes the modal", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("Enter in the modal input submits and adds the item", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.keyboard.type("Keyboard item");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Keyboard item")).toBeVisible();
});

test("+ ADD button opens the modal when activated via keyboard Enter", async ({
  page,
}) => {
  await page.getByRole("button", { name: /\+ add/i }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});

// --- aria-live region ---

test("page has an aria-live region for screen reader announcements", async ({
  page,
}) => {
  await expect(page.locator("[aria-live]")).toBeAttached();
});

test("aria-live region updates when an item is added", async ({ page }) => {
  const liveRegion = page.locator("[aria-live]").first();
  const before = await liveRegion.textContent();

  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.keyboard.type("Announced item");
  await page.keyboard.press("Enter");

  await expect(liveRegion).not.toHaveText(before ?? "");
});

test("aria-live region updates when an item is deleted", async ({ page }) => {
  await page.getByRole("button", { name: /\+ add/i }).click();
  await page.keyboard.type("Delete me");
  await page.keyboard.press("Enter");

  const liveRegion = page.locator("[aria-live]").first();
  const before = await liveRegion.textContent();

  await page.getByText("Delete me").click();
  await page.getByRole("button", { name: /delete/i }).click();

  await expect(liveRegion).not.toHaveText(before ?? "");
});
