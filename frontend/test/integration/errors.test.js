import { screen } from '@testing-library/dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { request, AUTH_EVENT } from '../../src/api/api';
import { router } from '../../src/routers';
import { seedSession } from '../helpers';
import { server } from '../msw/server';

describe('API and routing errors', () => {
    it('пробрасывает 500 как ApiError', async () => {
        server.use(
            http.get('http://localhost/api/users/me', () =>
                HttpResponse.json({ message: 'Сервер упал' }, { status: 500 })
            )
        );

        await expect(request('/api/users/me')).rejects.toMatchObject({
            status: 500,
            message: 'Сервер упал',
        });
    });

    it('при 401 очищает сессию и отправляет AUTH_EVENT', async () => {
        localStorage.setItem('accessToken', 'expired-token');
        server.use(
            http.get('http://localhost/api/users/me', () =>
                HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            )
        );

        const listener = vi.fn();
        window.addEventListener(AUTH_EVENT, listener);

        await expect(request('/api/users/me')).rejects.toMatchObject({ status: 401 });

        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(listener).toHaveBeenCalledTimes(1);

        window.removeEventListener(AUTH_EVENT, listener);
    });

    it('показывает error-state при 500 на главной', async () => {
        seedSession();
        history.replaceState({}, '', '/');
        server.use(
            http.get('http://localhost/api/users/me', () =>
                HttpResponse.json({ message: 'Сервер упал' }, { status: 500 })
            )
        );

        await router();

        expect(await screen.findByRole('alert')).not.toBeNull();
        expect(screen.getByText(/Ошибка: Сервер упал/)).not.toBeNull();
    });
});
