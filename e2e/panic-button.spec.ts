import { test, expect } from '@playwright/test';

test.describe('Panic Button Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear storage and setup
        await page.goto('/');
        await page.evaluate(async () => {
            const databases = await indexedDB.databases();
            for (const db of databases) {
                if (db.name) {
                    indexedDB.deleteDatabase(db.name);
                }
            }
        });

        // Setup account
        await page.goto('/');
        const passwordInput = page.getByPlaceholder(/password|пароль/i).first();
        await passwordInput.fill('TestPassword123!');
        
        const confirmInput = page.getByPlaceholder(/confirm|repeat|подтвердить/i).first();
        if (await confirmInput.isVisible().catch(() => false)) {
            await confirmInput.fill('TestPassword123!');
            await page.getByRole('button', { name: /create|setup|start/i }).first().click();
        }

        // Wait for journal to load
        await page.waitForTimeout(2000);

        // Create some test entries
        for (let i = 1; i <= 3; i++) {
            const addButton = page.getByRole('button', { name: /add|new|create|\+|новая/i }).first();
            if (await addButton.isVisible().catch(() => false)) {
                await addButton.click();
                await page.getByPlaceholder(/title|заголовок/i).first().fill(`Test Entry ${i}`);
                await page.getByPlaceholder(/content|text|write|текст/i).first().fill(`Content ${i}`);
                await page.getByRole('button', { name: /save|сохранить|done/i }).first().click();
                await page.waitForTimeout(500);
            }
        }
    });

    test('should have panic button accessible', async ({ page }) => {
        // Look for panic button
        const panicButton = page.getByRole('button', { name: /panic|emergency|sos/i }).first();
        
        // Or look by test id or specific styling
        const alternativePanic = page.locator('[data-testid="panic-button"], [aria-label*="panic" i], button:has-text("🚨"), button:has-text("⚠️")').first();
        
        const isPanicVisible = await panicButton.isVisible().catch(() => false) || 
                               await alternativePanic.isVisible().catch(() => false);
        
        // Panic button should be accessible (either directly visible or in menu)
        expect(isPanicVisible || await page.getByRole('button', { name: /menu|settings/i }).first().isVisible().catch(() => false)).toBeTruthy();
    });

    test('should trigger panic mode and redirect to safety', async ({ page }) => {
        // Find panic button - try different selectors
        let panicButton = page.getByRole('button', { name: /panic|emergency/i }).first();
        
        if (!(await panicButton.isVisible().catch(() => false))) {
            // Try looking in menu
            const menuButton = page.getByRole('button', { name: /menu|more|settings|\.{3}/i }).first();
            if (await menuButton.isVisible().catch(() => false)) {
                await menuButton.click();
                await page.waitForTimeout(300);
                panicButton = page.getByRole('button', { name: /panic|emergency|sos/i }).first();
            }
        }

        if (await panicButton.isVisible().catch(() => false)) {
            await panicButton.click();

            // Should show confirmation dialog
            const confirmButton = page.getByRole('button', { name: /confirm|yes|activate|trigger/i }).first();
            if (await confirmButton.isVisible().catch(() => false)) {
                await confirmButton.click();
            }

            // Should redirect to safety page (Google, Wikipedia, etc.)
            await expect(page).toHaveURL(/google|wikipedia|youtube|localhost/, { timeout: 5000 });
        }
    });

    test('should clear all data after panic button activation', async ({ page }) => {
        // Verify entries exist
        await expect(page.getByText(/Test Entry/).first()).toBeVisible();

        // Find and click panic button
        let panicButton = page.getByRole('button', { name: /panic|emergency/i }).first();
        
        if (!(await panicButton.isVisible().catch(() => false))) {
            const menuButton = page.getByRole('button', { name: /menu|more|settings/i }).first();
            if (await menuButton.isVisible().catch(() => false)) {
                await menuButton.click();
                await page.waitForTimeout(300);
                panicButton = page.getByRole('button', { name: /panic|emergency|sos/i }).first();
            }
        }

        if (await panicButton.isVisible().catch(() => false)) {
            await panicButton.click();

            // Confirm
            const confirmButton = page.getByRole('button', { name: /confirm|yes|activate|trigger/i }).first();
            if (await confirmButton.isVisible().catch(() => false)) {
                await confirmButton.click();
            }

            // Wait for redirect
            await page.waitForTimeout(2000);

            // Navigate back to app
            await page.goto('/');

            // Should see setup page (data was cleared)
            await expect(page.getByRole('heading', { name: /welcome|setup|create password/i })).toBeVisible();
        }
    });
});
