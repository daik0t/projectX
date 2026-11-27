import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderForgotPassword } from '../../src/pages/forgotPasswordPage';
import { renderResetPassword } from '../../src/pages/resetPasswordPage';
import { server } from '../msw/server';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('password recovery', () => {
    it('отправляет письмо восстановления пароля', async () => {
        const user = userEvent.setup();
        renderForgotPassword();

        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.click(screen.getByRole('button', { name: 'Отправить' }));

        expect(await screen.findByText('Инструкции отправлены')).not.toBeNull();
    });

    it('показывает ошибку отправки письма', async () => {
        server.use(
            http.post('http://localhost/api/auth/forgot-password', () =>
                HttpResponse.json({ message: 'Ошибка отправки' }, { status: 500 })
            )
        );

        const user = userEvent.setup();
        renderForgotPassword();

        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.click(screen.getByRole('button', { name: 'Отправить' }));

        expect(await screen.findByText('Ошибка отправки')).not.toBeNull();
    });

    it('показывает ошибку при отсутствии токена сброса', () => {
        history.replaceState({}, '', '/reset-password');
        renderResetPassword();

        expect(screen.getByText(/Ссылка недействительна/)).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Сохранить пароль' })).toBeNull();
    });

    it('проверяет совпадение паролей', async () => {
        const user = userEvent.setup();
        history.replaceState({}, '', '/reset-password?token=reset-token');
        renderResetPassword();

        await user.type(screen.getByLabelText('Новый пароль'), 'password123');
        await user.type(screen.getByLabelText('Повторите новый пароль'), 'different123');
        await user.click(screen.getByRole('button', { name: 'Сохранить пароль' }));

        expect(await screen.findByText('Пароли не совпадают')).not.toBeNull();
    });

    it('успешно сбрасывает пароль', async () => {
        const user = userEvent.setup();
        const originalSetTimeout = globalThis.setTimeout;
        const delayed = [];
        vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback, delay, ...args) => {
            if (delay === 1500) {
                delayed.push(() => callback(...args));
                return 0;
            }
            return originalSetTimeout(callback, delay, ...args);
        });

        history.replaceState({}, '', '/reset-password?token=reset-token');
        renderResetPassword();

        await user.type(screen.getByLabelText('Новый пароль'), 'password123');
        await user.type(screen.getByLabelText('Повторите новый пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Сохранить пароль' }));

        expect(await screen.findByText('Пароль изменён')).not.toBeNull();
        expect(delayed).toHaveLength(1);
    });
});
