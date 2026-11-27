import { screen, waitFor, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { renderLogin } from '../../src/pages/loginPage';
import { renderRegister } from '../../src/pages/registerPage';
import { server } from '../msw/server';

describe('auth pages', () => {
    it('логинит пользователя и сохраняет сессию', async () => {
        const user = userEvent.setup();
        history.replaceState({}, '', '/login');
        renderLogin();

        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

        await waitFor(() => {
            expect(localStorage.getItem('accessToken')).toBe('test-token');
        });
        expect(window.location.pathname).toBe('/');
    });

    it('показывает ошибку при неверном пароле', async () => {
        server.use(
            http.post('http://localhost/api/auth/login', () =>
                HttpResponse.json({ message: 'Неверный пароль' }, { status: 401 })
            )
        );

        const user = userEvent.setup();
        history.replaceState({}, '', '/login');
        renderLogin();

        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Пароль'), 'wrong');
        await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

        expect(await screen.findByText('Неверный пароль')).not.toBeNull();
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('валидирует данные регистрации', async () => {
        const user = userEvent.setup();
        history.replaceState({}, '', '/register');
        renderRegister();

        await user.type(screen.getByLabelText('Имя пользователя'), 'x');
        await user.type(screen.getByLabelText('Email'), 'new@example.com');
        await user.type(screen.getByLabelText('Пароль'), 'password123');

        screen.getByRole('button', { name: 'Подтвердить' })
            .closest('form')
            .setAttribute('novalidate', '');

        fireEvent.submit(screen.getByRole('button', { name: 'Подтвердить' }).closest('form'));

        expect(await screen.findByText(/Имя: 3–30 символов/)).not.toBeNull();
    });

    it('регистрирует пользователя и переводит на /login', async () => {
        const user = userEvent.setup();
        const navigateListener = vi.fn();
        window.addEventListener('route:navigate', navigateListener);
        history.replaceState({}, '', '/register');
        renderRegister();

        await user.type(screen.getByLabelText('Имя пользователя'), 'New_User');
        await user.type(screen.getByLabelText('Email'), 'new@example.com');
        await user.type(screen.getByLabelText('Пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

        await waitFor(() => {
            expect(window.location.pathname).toBe('/login');
        });
        expect(navigateListener).toHaveBeenCalled();
        window.removeEventListener('route:navigate', navigateListener);
    });
});
