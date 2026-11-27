import { screen, waitFor } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { router } from '../../src/routers';
import { seedSession } from '../helpers';
import { testUser } from '../msw/server';

describe('router guards', () => {
    it('не пускает в приватные разделы и очищает просроченную сессию', async () => {
        history.replaceState({}, '', '/settings');

        await router();

        expect(window.location.pathname).toBe('/login');
        expect(await screen.findByText('Авторизация')).not.toBeNull();

        localStorage.setItem('accessToken', 'expired-token');
        localStorage.setItem('user', JSON.stringify(testUser));
        localStorage.setItem('tokenExpiresAt', String(Date.now() - 60_000));
        history.replaceState({}, '', '/settings');

        await router();

        await waitFor(() => {
            expect(window.location.pathname).toBe('/login');
        });
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(await screen.findByText('Авторизация')).not.toBeNull();
    });

    it('обрабатывает успешный OAuth callback', async () => {
        history.replaceState({}, '', '/oauth/callback?token=oauth-token');

        await router();

        await waitFor(() => {
            expect(window.location.pathname).toBe('/');
        });
        expect(localStorage.getItem('accessToken')).toBe('oauth-token');
        expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ id: testUser.id });
        expect(await screen.findByText(/Tester/)).not.toBeNull();
    });

    it('показывает ошибку OAuth callback на логине', async () => {
        history.replaceState({}, '', '/oauth/callback?error=access_denied');

        await router();

        await waitFor(() => {
            expect(window.location.pathname).toBe('/login');
        });
        expect(await screen.findByText('access_denied')).not.toBeNull();
    });

    it('показывает 404 для неизвестного маршрута', async () => {
        seedSession();
        history.replaceState({}, '', '/unknown-route');

        await router();

        expect(await screen.findByText(/404/)).not.toBeNull();
    });

    it('перенаправляет авторизованного пользователя с /login на главную', async () => {
        seedSession();
        history.replaceState({}, '', '/login');

        await router();

        await waitFor(() => {
            expect(window.location.pathname).toBe('/');
        });
        expect(await screen.findByText(/Tester/)).not.toBeNull();
    });
});
