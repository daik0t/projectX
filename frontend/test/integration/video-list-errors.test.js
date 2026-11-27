import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_EVENT } from '../../src/api/api';
import { renderMain } from '../../src/pages/mainPage';
import { seedMetadata, seedSession } from '../helpers';
import { server, testVideos } from '../msw/server';

describe('video list errors', () => {
    it('показывает ошибку загрузки и повторяет запрос', async () => {
        let fail = true;

        server.use(
            http.get('http://localhost/api/videos/me', () => (
                fail
                    ? HttpResponse.json({ message: 'Сервер видео упал' }, { status: 500 })
                    : HttpResponse.json(testVideos)
            ))
        );

        seedSession();
        seedMetadata();

        const user = userEvent.setup();
        await renderMain();

        expect(await screen.findByRole('alert')).not.toBeNull();
        expect(screen.getByText(/Не удалось загрузить видео/)).not.toBeNull();

        fail = false;
        await user.click(screen.getByRole('button', { name: 'Повторить' }));

        await waitFor(() => {
            expect(document.querySelectorAll('.video-card')).toHaveLength(2);
        });
        expect(await screen.findByText('Видео 1')).not.toBeNull();
    });

    it('при 401 очищает сессию и снимает aria-busy', async () => {
        server.use(
            http.get('http://localhost/api/videos/me', () =>
                HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            )
        );

        seedSession();
        seedMetadata();

        const listener = vi.fn();
        window.addEventListener(AUTH_EVENT, listener);

        await renderMain();

        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(listener).toHaveBeenCalledTimes(1);
        expect(document.querySelector('#video-grid').getAttribute('aria-busy')).toBe('false');
        expect(screen.queryByRole('button', { name: 'Повторить' })).toBeNull();

        window.removeEventListener(AUTH_EVENT, listener);
    });
});
