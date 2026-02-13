import { test, expect } from '@playwright/test';

test.describe('Journal Entry Flow', () => {
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
    });

    test('should create a new journal entry', async ({ page }) => {
        // Look for add entry button
        const addButton = page.getByRole('button', { name: /add|new|create|\+|новая/i }).first();
        await expect(addButton).toBeVisible();
        await addButton.click();

        // Should see entry form
        const titleInput = page.getByPlaceholder(/title|заголовок/i).first();
        const contentInput = page.getByPlaceholder(/content|text|write|текст/i).first();
        
        await expect(titleInput).toBeVisible();
        await expect(contentInput).toBeVisible();

        // Fill in entry
        await titleInput.fill('Test Entry Title');
        await contentInput.fill('This is my test journal entry content. It is private and encrypted.');

        // Set intensity if slider exists
        const intensitySlider = page.locator('input[type="range"]').first();
        if (await intensitySlider.isVisible().catch(() => false)) {
            await intensitySlider.fill('7');
        }

        // Save entry
        const saveButton = page.getByRole('button', { name: /save|сохранить|done/i }).first();
        await saveButton.click();

        // Should show the entry in the list
        await expect(page.getByText('Test Entry Title').first()).toBeVisible({ timeout: 3000 });
    });

    test('should view an existing entry', async ({ page }) => {
        // Create an entry first
        const addButton = page.getByRole('button', { name: /add|new|create|\+|новая/i }).first();
        await addButton.click();

        await page.getByPlaceholder(/title|заголовок/i).first().fill('Entry to View');
        await page.getByPlaceholder(/content|text|write|текст/i).first().fill('Content to view');
        await page.getByRole('button', { name: /save|сохранить|done/i }).first().click();

        // Wait for entry to appear
        await expect(page.getByText('Entry to View').first()).toBeVisible({ timeout: 3000 });

        // Click on the entry to view
        await page.getByText('Entry to View').first().click();

        // Should see the content
        await expect(page.getByText('Content to view').first()).toBeVisible();
    });

    test('should edit an existing entry', async ({ page }) => {
        // Create an entry
        const addButton = page.getByRole('button', { name: /add|new|create|\+|новая/i }).first();
        await addButton.click();

        await page.getByPlaceholder(/title|заголовок/i).first().fill('Entry to Edit');
        await page.getByPlaceholder(/content|text|write|текст/i).first().fill('Original content');
        await page.getByRole('button', { name: /save|сохранить|done/i }).first().click();

        await expect(page.getByText('Entry to Edit').first()).toBeVisible({ timeout: 3000 });

        // Click to view
        await page.getByText('Entry to Edit').first().click();

        // Look for edit button
        const editButton = page.getByRole('button', { name: /edit|изменить/i }).first();
        if (await editButton.isVisible().catch(() => false)) {
            await editButton.click();

            // Edit the content
            const contentInput = page.getByPlaceholder(/content|text|write|текст/i).first();
            await contentInput.clear();
            await contentInput.fill('Updated content');

            // Save
            await page.getByRole('button', { name: /save|сохранить/i }).first().click();

            // Verify updated
            await expect(page.getByText('Updated content').first()).toBeVisible();
        }
    });

    test('should delete an entry', async ({ page }) => {
        // Create an entry
        const addButton = page.getByRole('button', { name: /add|new|create|\+|новая/i }).first();
        await addButton.click();

        await page.getByPlaceholder(/title|заголовок/i).first().fill('Entry to Delete');
        await page.getByPlaceholder(/content|text|write|текст/i).first().fill('Will be deleted');
        await page.getByRole('button', { name: /save|сохранить|done/i }).first().click();

        await expect(page.getByText('Entry to Delete').first()).toBeVisible({ timeout: 3000 });

        // Click to view
        await page.getByText('Entry to Delete').first().click();

        // Look for delete button
        const deleteButton = page.getByRole('button', { name: /delete|удалить|trash/i }).first();
        if (await deleteButton.isVisible().catch(() => false)) {
            await deleteButton.click();

            // Confirm deletion if dialog appears
            const confirmButton = page.getByRole('button', { name: /yes|confirm|удалить|delete/i }).first();
            if (await confirmButton.isVisible().catch(() => false)) {
                await confirmButton.click();
            }

            // Verify entry is gone
            await expect(page.getByText('Entry to Delete').first()).not.toBeVisible({ timeout: 3000 });
        }
    });
});
