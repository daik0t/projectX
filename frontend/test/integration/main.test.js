import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderMain } from '../../src/pages/mainPage';
import { seedMain, seedMetadata, seedSession } from '../helpers';
import { server, testVideos } from '../msw/server';

async function mountMain() {
    seedMain();
    await renderMain();
    await screen.findByText('Видео 1');
}

describe('main page', () => {
    it('показывает в сайдбаре только теги добавленных видео', async () => {
        await mountMain();

        expect(await screen.findByRole('button', { name: /Категория/ })).not.toBeNull();
        expect(screen.getByRole('button', { name: /^>Фильтр$/ })).not.toBeNull();
        expect(screen.queryByRole('button', { name: /Неиспользуемый/ })).toBeNull();
        expect(screen.getByLabelText('Текущий путь').value).toBe('Tester>видео');
    });

    it('применяет фильтр, затем сужает его категорией и строит breadcrumb', async () => {
        const user = userEvent.setup();
        await mountMain();

        await user.click(screen.getByRole('button', { name: 'Фильтр по тегам' }));
        await user.click(await screen.findByRole('checkbox', { name: /^Фильтр$/ }));
        await user.click(screen.getByRole('button', { name: 'Применить' }));

        const path = screen.getByLabelText('Текущий путь');
        await waitFor(() => {
            expect(path.value).toBe('Tester>видео>Фильтр');
        });
        expect(screen.getByRole('button', { name: /^>все$/ }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.queryByText('Видео 2')).toBeNull();
        expect(screen.getByText('Видео 1')).not.toBeNull();

        await user.click(screen.getByRole('button', { name: /Категория/ }));

        await waitFor(() => {
            expect(path.value).toBe('Tester>видео>Категория>Фильтр');
        });
        expect(screen.getByRole('button', { name: /Категория/ }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: /^>все$/ }).getAttribute('aria-pressed')).toBe('false');
        expect(screen.getByText('Видео 1')).not.toBeNull();
        expect(screen.queryByText('Видео 2')).toBeNull();
    });

    it('добавляет видео и обновляет список и сайдбар', async () => {
        seedSession();
        seedMetadata();

        let videos = [...testVideos];
        server.use(
            http.get('http://localhost/api/videos/me', () => HttpResponse.json(videos)),
            http.post('http://localhost/api/videos', async ({ request }) => {
                const body = await request.json();
                const created = {
                    id: 3,
                    url: body.url,
                    tags: [{ id: 2, name: 'Фильтр' }],
                };
                videos = [created, ...videos];
                return HttpResponse.json(created, { status: 201 });
            })
        );

        const user = userEvent.setup();
        await renderMain();

        await user.click(screen.getByRole('button', { name: 'Добавить видео' }));
        const dialog = await screen.findByRole('dialog');

        await user.type(within(dialog).getByLabelText('Ссылка на видео'), 'https://youtu.be/ccccccccccc');
        await user.click(within(dialog).getByRole('checkbox', { name: /Фильтр/ }));
        await user.click(within(dialog).getByRole('button', { name: 'Добавить' }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
        expect(await screen.findByText('Новое видео')).not.toBeNull();
        expect(screen.getByRole('button', { name: /^>Фильтр$/ })).not.toBeNull();
    });

    it('сбрасывает категорию при повторном применении dropdown', async () => {
        const user = userEvent.setup();
        await mountMain();

        await user.click(screen.getByRole('button', { name: /Категория/ }));
        await waitFor(() => {
            expect(screen.getByLabelText('Текущий путь').value).toBe('Tester>видео>Категория');
        });

        await user.click(screen.getByRole('button', { name: 'Фильтр по тегам' }));
        await user.click(await screen.findByRole('checkbox', { name: /^Фильтр$/ }));
        await user.click(screen.getByRole('button', { name: 'Применить' }));

        await waitFor(() => {
            expect(screen.getByLabelText('Текущий путь').value).toBe('Tester>видео>Фильтр');
        });
        expect(screen.getByRole('button', { name: /^>все$/ }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: /Категория/ }).getAttribute('aria-pressed')).toBe('false');
    });
});
