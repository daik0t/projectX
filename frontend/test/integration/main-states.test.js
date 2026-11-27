import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderMain } from '../../src/pages/mainPage';
import { seedMain, seedMetadata, seedSession } from '../helpers';
import { server, testVideos } from '../msw/server';

describe('main page states', () => {
    it('показывает пустой список без тегов', async () => {
        seedSession();
        seedMetadata([]);
        server.use(
            http.get('http://localhost/api/videos/me', () => HttpResponse.json([]))
        );

        await renderMain();

        expect(await screen.findByText('У вас пока нет видео.')).not.toBeNull();
        expect(screen.getByRole('button', { name: /^>все$/ })).not.toBeNull();
        expect(screen.queryByRole('button', { name: /^>Категория$/ })).toBeNull();
    });

    it('показывает отсутствие результатов фильтра и сбрасывает его', async () => {
        seedMain();
        const user = userEvent.setup();
        await renderMain();

        await user.click(screen.getByRole('button', { name: 'Фильтр по тегам' }));
        await user.click(await screen.findByRole('checkbox', { name: /^Неиспользуемый$/ }));
        await user.click(screen.getByRole('button', { name: 'Применить' }));

        expect(await screen.findByText('По выбранным тегам видео не найдены.')).not.toBeNull();
        expect(screen.getByLabelText('Текущий путь').value).toBe('Tester>видео>Неиспользуемый');

        await user.click(screen.getByRole('button', { name: 'Сбросить' }));

        await waitFor(() => {
            expect(screen.queryByText('По выбранным тегам видео не найдены.')).toBeNull();
        });
        expect(await screen.findByText('Видео 1')).not.toBeNull();
        expect(screen.getByLabelText('Текущий путь').value).toBe('Tester>видео');
    });

    it('комбинирует несколько фильтров и категорию', async () => {
        seedMain();
        const user = userEvent.setup();
        await renderMain();

        await user.click(screen.getByRole('button', { name: 'Фильтр по тегам' }));
        await user.click(await screen.findByRole('checkbox', { name: /^Фильтр$/ }));
        await user.click(screen.getByRole('checkbox', { name: /^Неиспользуемый$/ }));
        await user.click(screen.getByRole('button', { name: 'Применить' }));

        await waitFor(() => {
            expect(screen.getByLabelText('Текущий путь').value).toBe('Tester>видео>Фильтр_Неиспользуемый');
        });
        expect(screen.getByText('Видео 1')).not.toBeNull();
        expect(screen.queryByText('Видео 2')).toBeNull();

        await user.click(screen.getByRole('button', { name: /^>Категория$/ }));

        await waitFor(() => {
            expect(screen.getByLabelText('Текущий путь').value).toBe('Tester>видео>Категория>Фильтр_Неиспользуемый');
        });
        expect(screen.getByText('Видео 1')).not.toBeNull();
        expect(screen.queryByText('Видео 2')).toBeNull();
    });

    it('оставляет карточку при ошибке oEmbed после добавления', async () => {
        seedSession();
        seedMetadata();

        let videos = [...testVideos];
        server.use(
            http.get('http://localhost/api/videos/me', () => HttpResponse.json(videos)),
            http.post('http://localhost/api/videos', async ({ request }) => {
                const body = await request.json();
                const created = { id: 3, url: body.url, tags: [] };
                videos = [created, ...videos];
                return HttpResponse.json(created, { status: 201 });
            }),
            http.get('https://www.youtube.com/oembed*', () =>
                HttpResponse.json({ message: 'oEmbed unavailable' }, { status: 500 })
            )
        );

        const user = userEvent.setup();
        await renderMain();

        await user.click(screen.getByRole('button', { name: 'Добавить видео' }));
        const dialog = await screen.findByRole('dialog');
        await user.type(within(dialog).getByLabelText('Ссылка на видео'), 'https://youtu.be/ccccccccccc');
        await user.click(within(dialog).getByRole('button', { name: 'Добавить' }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.video-card')).toHaveLength(3);
        });
        expect(screen.getAllByText('Без названия').length).toBeGreaterThan(0);
    });
});
