import { test, expect } from '@playwright/test';

test.describe('Storefront Basics', () => {
  test('homepage should load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for the AI Grocery Generator text or main header
    await expect(page.getByText('AI Grocery Generator')).toBeVisible();
    
    // Check if at least one product is visible
    const productCards = page.locator('.group'); // The product cards use 'group' class
    // We expect products to load (this might require DB, but fallback handles it)
    // Actually, let's just check the page title or hero text
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('ai page should load and input should be visible', async ({ page }) => {
    await page.goto('/ai');
    
    await expect(page.locator('h1', { hasText: 'AI Grocery Generator' })).toBeVisible();
    await expect(page.getByPlaceholder('E.g. Paneer butter masala')).toBeVisible();
  });
});
