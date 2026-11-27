import { test, expect } from '@playwright/test';
import { mockApi, waitForMain } from './helpers';

test.describe('modals and focus', () => {
    test.beforeEach(async ({ page }) => {
        await mockApi(page);
        await page.goto('/');
        await waitForMain(page);
    });

    test('add modal удерживает фокус и закрывается по Escape', async ({ page }) => {
        const trigger = page.locator('#btn-add');
        await trigger.click();

        const dialog = page.locator('#add-window');
        await expect(dialog).toHaveClass(/show/);
        await expect(page.locator('#input-link')).toBeFocused();

        for (let i = 0; i < 6; i += 1) {
            await page.keyboard.press('Tab');
            const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('#add-window')));
            expect(inside).toBe(true);
        }

        await page.keyboard.press('Escape');
        await expect(dialog).not.toHaveClass(/show/);
        await expect(trigger).toBeFocused();
    });

    test('edit modal закрывается по Escape и возвращает фокус', async ({ page }) => {
        await page.locator('.video-card').first().click({ button: 'right' });
        await page.locator('#btn-edit').click();

        const dialog = page.locator('#edit-window');
        await expect(dialog).toHaveClass(/show/);

        await page.keyboard.press('Escape');
        await expect(dialog).not.toHaveClass(/show/);
        await expect(page.locator('.video-card').first()).toBeFocused();
    });
});
