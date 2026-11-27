import { test, expect } from '@playwright/test';
import { mockApi, waitForMain } from './helpers';

test.describe('navigation', () => {
    test('back/forward между главной и настройками', async ({ page }) => {
        await mockApi(page);
        await page.goto('/');
        await waitForMain(page);

        await page.locator('#btn-setting').click();
        await expect(page).toHaveURL(/\/settings$/);
        await expect(page.getByText('Настройки')).toBeVisible();

        await page.goBack();
        await expect(page).toHaveURL(/\/$/);
        await waitForMain(page);

        await page.goForward();
        await expect(page).toHaveURL(/\/settings$/);
        await expect(page.getByText('Настройки')).toBeVisible();
    });

    test('OAuth callback сохраняет токен и открывает главную', async ({ page }) => {
        await mockApi(page, { auth: false });

        await page.goto('/oauth/callback?token=oauth-token');
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByText('Tester')).toBeVisible();
        await waitForMain(page);

        const token = await page.evaluate(() => localStorage.getItem('accessToken'));
        expect(token).toBe('oauth-token');
    });

    test('OAuth callback с ошибкой показывает сообщение на логине', async ({ page }) => {
        await mockApi(page, { auth: false });

        await page.goto('/oauth/callback?error=access_denied');

        await expect(page).toHaveURL(/\/login\?error=access_denied/);
        await expect(page.getByText('access_denied')).toBeVisible();
    });

    test('приватный маршрут без токена ведёт на логин', async ({ page }) => {
        await mockApi(page, { auth: false });

        await page.goto('/settings');

        await expect(page).toHaveURL(/\/login$/);
        await expect(page.locator('.auth-widget-title')).toHaveText('Авторизация');
    });

    test('выход очищает сессию и открывает логин', async ({ page }) => {
        await mockApi(page);
        await page.goto('/');
        await waitForMain(page);

        await page.locator('#btn-home').click();
        await page.locator('#btn-exit').click();

        await expect(page).toHaveURL(/\/login$/);
        await expect(page.locator('.auth-widget-title')).toHaveText('Авторизация');

        const storage = await page.evaluate(() => ({
            token: localStorage.getItem('accessToken'),
            user: localStorage.getItem('user'),
            metadata: localStorage.getItem('yt_metadata:1'),
        }));
        expect(storage).toEqual({ token: null, user: null, metadata: null });
    });
});
