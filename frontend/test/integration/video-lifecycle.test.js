import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderMain } from '../../src/pages/mainPage';
import { seedMain, seedMetadata, seedSession } from '../helpers';
import { server, testTags, testVideos } from '../msw/server';

function cloneVideos() {
    return testVideos.map((video) => ({
        ...video,
        tags: video.tags.map((tag) => ({ ...tag })),
    }));
}

describe('video lifecycle', () => {
    it('сохраняет теги видео и обновляет сайдбар', async () => {
        const videos = cloneVideos();
        let savedTagIds = null;

        server.use(
            http.get('http://localhost/api/videos/me', () => HttpResponse.json(videos)),
            http.put('http://localhost/api/videos/:id/tags', async ({ request, params }) => {
                const body = await request.json();
                savedTagIds = body.tagIds;
                const video = videos.find((item) => item.id === Number(params.id));
                video.tags = body.tagIds
                    .map((id) => testTags.find((tag) => tag.id === id))
                    .filter(Boolean);
                return HttpResponse.json(video);
            })
        );

        seedSession();
        seedMetadata(videos);

        const user = userEvent.setup();
        await renderMain();

        const card = document.querySelector('.video-card[data-video-id="1"]');
        fireEvent.contextMenu(card, { bubbles: true, clientX: 20, clientY: 20 });
        await user.click(await screen.findByRole('menuitem', { name: 'Редактировать' }));

        const dialog = await screen.findByRole('dialog');
        const filterCheckbox = within(dialog).getByRole('checkbox', { name: /Фильтр/ });
        expect(filterCheckbox.checked).toBe(true);

        await user.click(filterCheckbox);
        await user.click(within(dialog).getByRole('button', { name: 'Редактировать' }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
        expect(savedTagIds).toEqual(['1']);

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /^>Фильтр$/ })).toBeNull();
        });
        expect(screen.getByRole('button', { name: /Категория/ })).not.toBeNull();
    });

    it('удаляет видео через меню действий и обновляет сайдбар', async () => {
        let videos = cloneVideos();

        server.use(
            http.get('http://localhost/api/videos/me', () => HttpResponse.json(videos)),
            http.delete('http://localhost/api/videos/:id', ({ params }) => {
                videos = videos.filter((video) => video.id !== Number(params.id));
                return new HttpResponse(null, { status: 204 });
            })
        );

        seedSession();
        seedMetadata(videos);

        const user = userEvent.setup();
        await renderMain();

        const card = document.querySelector('.video-card[data-video-id="1"]');
        fireEvent.contextMenu(card, { bubbles: true, clientX: 20, clientY: 20 });
        await user.click(await screen.findByRole('menuitem', { name: 'Удалить' }));

        await waitFor(() => {
            expect(screen.queryByText('Видео 1')).toBeNull();
        });
        expect(screen.queryByRole('button', { name: /^>Фильтр$/ })).toBeNull();
        expect(screen.getByText('Видео 2')).not.toBeNull();
    });

    it('оставляет окно добавления открытым при ошибке API', async () => {
        server.use(
            http.post('http://localhost/api/videos', () =>
                HttpResponse.json({ message: 'Не удалось создать видео' }, { status: 500 })
            )
        );

        seedSession();
        seedMetadata();

        const user = userEvent.setup();
        await renderMain();

        await user.click(screen.getByRole('button', { name: 'Добавить видео' }));
        const dialog = await screen.findByRole('dialog');

        await user.type(within(dialog).getByLabelText('Ссылка на видео'), 'https://youtu.be/ccccccccccc');
        await user.click(within(dialog).getByRole('button', { name: 'Добавить' }));

        expect(await screen.findByText(/Ошибка при добавлении/)).not.toBeNull();
        expect(screen.getByRole('dialog')).not.toBeNull();
        expect(document.querySelectorAll('.video-card')).toHaveLength(2);
    });
});
