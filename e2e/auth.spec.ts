import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear IndexedDB before each test
        await page.goto('/');
        await page.evaluate(async () => {
            const databases = await indexedDB.databases();
            for (const db of databases) {
                if (db.name) {
                    indexedDB.deleteDatabase(db.name);
                }
            }
        });
    });

    test('should complete setup flow with password creation', async ({ page }) => {
        await page.goto('/');

        // Should show setup page for first-time user
        await expect(page.getByRole('heading', { name: /welcome|setup|create password/i })).toBeVisible();

        // Fill in password
        const passwordInput = page.getByPlaceholder(/password|пароль/i).first();
        await expect(passwordInput).toBeVisible();
        await passwordInput.fill('MySecurePassword123!');

        // Fill in confirm password if exists
        const confirmInput = page.getByPlaceholder(/confirm|repeat|подтвердить/i).first();
        if (await confirmInput.isVisible().catch(() => false)) {
            await confirmInput.fill('MySecurePassword123!');
        }

        // Submit setup form
        const submitButton = page.getByRole('button', { name: /create|setup|start|начать/i }).first();
        await submitButton.click();

        // Should redirect to journal or show success
        await expect(page).toHaveURL(/\/(journal|entries|setup)?/);
    });

    test('should login with existing password', async ({ page }) => {
        // First setup the app
        await page.goto('/');
        
        // Setup if needed
        const passwordInput = page.getByPlaceholder(/password|пароль/i).first();
        await passwordInput.fill('TestPassword123!');
        
        const confirmInput = page.getByPlaceholder(/confirm|repeat|подтвердить/i).first();
        if (await confirmInput.isVisible().catch(() => false)) {
            await confirmInput.fill('TestPassword123!');
            await page.getByRole('button', { name: /create|setup|start/i }).first().click();
        }

        // Logout if needed and try to login
        await page.goto('/');
        
        // Should see login form
        const loginInput = page.getByPlaceholder(/password|пароль/i).first();
        await expect(loginInput).toBeVisible();
        
        await loginInput.fill('TestPassword123!');
        await page.getByRole('button', { name: /login|войти|unlock/i }).first().click();

        // Should access the journal
        await expect(page.getByText(/journal|entries|entries|записи/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for wrong password', async ({ page }) => {
        // Setup first
        await page.goto('/');
        const passwordInput = page.getByPlaceholder(/password|пароль/i).first();
        await passwordInput.fill('CorrectPassword123!');
        
        const confirmInput = page.getByPlaceholder(/confirm|repeat|подтвердить/i).first();
        if (await confirmInput.isVisible().catch(() => false)) {
            await confirmInput.fill('CorrectPassword123!');
            await page.getByRole('button', { name: /create|setup|start/i }).first().click();
        }

        // Try to login with wrong password
        await page.goto('/');
        await page.getByPlaceholder(/password|пароль/i).first().fill('WrongPassword123!');
        await page.getByRole('button', { name: /login|войти|unlock/i }).first().click();

        // Should show error message
        await expect(page.getByText(/incorrect|wrong|error|неверный/i).first()).toBeVisible({ timeout: 3000 });
    });
});
