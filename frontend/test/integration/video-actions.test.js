import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { renderMain } from '../../src/pages/mainPage';
import { seedMain, seedMetadata, seedSession } from '../helpers';
import { server, testVideos } from '../msw/server';

describe('video actions', () => {
    it('открывает свойства видео', async () => {
        seedMain();
        const user = userEvent.setup();
        await renderMain();

        const card = document.querySelector('.video-card[data-video-id="1"]');
        fireEvent.contextMenu(card, { bubbles: true, clientX: 20, clientY: 20 });
        await user.click(await screen.findByRole('menuitem', { name: 'Свойства' }));

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText(/Видео 1/)).not.toBeNull();
        expect(within(dialog).getByText(/Категория, Фильтр/)).not.toBeNull();
        expect(within(dialog).getByText(/https:\/\/youtu.be\/aaaaaaaaaaa/)).not.toBeNull();
    });

    it('делится ссылкой через системный share', async () => {
        const share = vi.fn().mockResolvedValue();
        Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: share,
        });

        seedMain();
        const user = userEvent.setup();
        await renderMain();

        const card = document.querySelector('.video-card[data-video-id="1"]');
        fireEvent.contextMenu(card, { bubbles: true, clientX: 20, clientY: 20 });
        await user.click(await screen.findByRole('menuitem', { name: 'Поделиться ссылкой' }));

        expect(share).toHaveBeenCalledWith({
            title: 'Видео 1',
            url: 'https://youtu.be/aaaaaaaaaaa',
        });
    });

    it('не удаляет видео при отмене подтверждения', async () => {
        let deleted = false;
        server.use(
            http.delete('http://localhost/api/videos/:id', () => {
                deleted = true;
                return new HttpResponse(null, { status: 204 });
            })
        );
        window.confirm.mockReturnValue(false);

        seedMain();
        const user = userEvent.setup();
        await renderMain();

        const card = document.querySelector('.video-card[data-video-id="1"]');
        fireEvent.contextMenu(card, { bubbles: true, clientX: 20, clientY: 20 });
        await user.click(await screen.findByRole('menuitem', { name: 'Удалить' }));

        expect(deleted).toBe(false);
        expect(screen.getByText('Видео 1')).not.toBeNull();
    });

    it('показывает пустое состояние после удаления последнего видео', async () => {
        let videos = [testVideos[0]];

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

        expect(await screen.findByText('У вас пока нет видео.')).not.toBeNull();
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /^>Категория$/ })).toBeNull();
        });
        expect(screen.getByRole('button', { name: /^>все$/ })).not.toBeNull();
    });
});
