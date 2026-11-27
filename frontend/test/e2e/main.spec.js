import { test, expect } from '@playwright/test';
import { mockApi, waitForMain } from './helpers';

test.describe('main page interactions', () => {
    test.beforeEach(async ({ page }) => {
        await mockApi(page);
        await page.goto('/');
        await waitForMain(page);
    });

    test('long-press открывает меню карточки, пустое место — только «Добавить»', async ({ page }) => {
        const card = page.locator('.video-card').first();
        const box = await card.boundingBox();

        await page.mouse.move(box.x + 20, box.y + 20);
        await page.mouse.down();
        await page.waitForTimeout(600);
        await page.mouse.up();

        const menu = page.locator('#action-window');
        await expect(menu).toHaveClass(/show/);
        await expect(menu.locator('#btn-action-add')).toBeDisabled();
        await expect(menu.locator('#btn-edit')).toBeEnabled();

        await page.keyboard.press('Escape');

        const gridBox = await page.locator('#video-grid').boundingBox();
        await page.mouse.click(gridBox.x + gridBox.width - 8, gridBox.y + gridBox.height - 8, {
            button: 'right',
        });

        await expect(menu).toHaveClass(/show/);
        await expect(menu.locator('#btn-action-add')).toBeEnabled();
        await expect(menu.locator('#btn-edit')).toBeDisabled();
    });

    test('drag-to-trash удаляет видео', async ({ page }) => {
        const card = page.locator('.video-card').first();
        await card.dragTo(page.locator('#trash'));

        await expect(page.locator('.video-card')).toHaveCount(1);
        await expect(page.getByText('Видео 1')).toHaveCount(0);
    });

    test('popover закрывается по Escape и возвращает фокус', async ({ page }) => {
        const filter = page.locator('#btn-filter');
        const popover = page.locator('#place-tags-filter');

        await filter.click();
        await expect(popover).toHaveClass(/show/);

        await page.keyboard.press('Escape');
        await expect(popover).not.toHaveClass(/show/);
        await expect(filter).toBeFocused();

        await filter.click();
        await expect(popover).toHaveClass(/show/);
        await filter.focus();
        await page.keyboard.press('Enter');
        await expect(popover).not.toHaveClass(/show/);
        await expect(filter).toBeFocused();
    });

    test('меню действий навигируется стрелками с клавиатуры', async ({ page }) => {
        await page.locator('.video-card').first().click({ button: 'right' });

        const menu = page.locator('#action-window');
        await expect(menu).toHaveClass(/show/);
        await expect(page.locator('#btn-share')).toBeFocused();

        await page.keyboard.press('End');
        await expect(page.locator('#btn-del')).toBeFocused();

        await page.keyboard.press('Home');
        await expect(page.locator('#btn-share')).toBeFocused();

        await page.keyboard.press('ArrowDown');
        await expect(page.locator('#btn-edit')).toBeFocused();
    });

    test('редактирование тегов обновляет сайдбар', async ({ page }) => {
        await page.locator('.video-card').first().click({ button: 'right' });
        await page.locator('#btn-edit').click();

        const dialog = page.locator('#edit-window');
        await expect(dialog).toHaveClass(/show/);
        await dialog.locator('input[name="tags"][value="2"]').uncheck({ force: true });
        await page.locator('#btn-apply-edit').click();

        await expect(dialog).not.toHaveClass(/show/);
        await expect(page.locator('#tags-list .video-tag[data-tag-id="2"]')).toHaveCount(0);
        await expect(page.locator('#tags-list .video-tag[data-tag-id="1"]')).toHaveCount(1);
    });

    test('добавление видео закрывает окно до завершения oEmbed', async ({ page }) => {
        let releaseMetadata;
        const metadataReady = new Promise((resolve) => {
            releaseMetadata = resolve;
        });

        await page.route(/youtube\.com\/oembed/, async (route) => {
            await metadataReady;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    title: 'Новое видео',
                    thumbnail_url: 'https://example.com/thumb.jpg',
                    author_name: 'Author',
                    provider_name: 'YouTube',
                }),
            });
        });

        await page.locator('#btn-add').click();
        await expect(page.locator('#add-window')).toHaveClass(/show/);
        await page.locator('#input-link').fill('https://youtu.be/ccccccccccc');
        await page.locator('#add-window #btn-apply').click();

        await expect(page.locator('#add-window')).not.toHaveClass(/show/);
        await expect(page.locator('.video-card')).toHaveCount(3);

        await expect.poll(() => typeof releaseMetadata).toBe('function');
        releaseMetadata();
        await expect(page.getByText('Новое видео')).toBeVisible();
    });
});
