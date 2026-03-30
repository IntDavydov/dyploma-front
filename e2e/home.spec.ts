import { test, expect } from '@playwright/test';

test('has title and nav buttons', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Shop-Sync Gateway/);

  // Check for the heading
  await expect(page.getByRole('heading', { name: /Global Shop-Sync Gateway/i })).toBeVisible();

  // Check for nav links
  const inventoryLink = page.getByRole('link', { name: /Inventory/i }).first();
  await expect(inventoryLink).toBeVisible();
  
  const statsLink = page.getByRole('link', { name: /Stats/i }).first();
  await expect(statsLink).toBeVisible();
});

test('can navigate to inventory', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Manage Inventory/i }).click();
  await expect(page).toHaveURL(/\/inventory/);
  await expect(page.getByRole('heading', { name: /Inventory/i })).toBeVisible();
});
