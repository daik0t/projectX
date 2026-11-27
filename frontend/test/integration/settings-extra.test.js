import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderSettingsPage } from '../../src/pages/settingsPage';
import { seedSession } from '../helpers';
import { server } from '../msw/server';

async function openSettings() {
    seedSession();
    await renderSettingsPage();
    await screen.findByText('Tester');
}

describe('settings branches', () => {
    it('использует локального пользователя, если профиль не загрузился', async () => {
        server.use(
            http.get('http://localhost/api/users/me', () =>
                HttpResponse.json({ message: 'Профиль недоступен' }, { status: 500 })
            )
        );

        await openSettings();

        expect(screen.getByText('Tester')).not.toBeNull();
        expect(screen.getByText('test@example.com')).not.toBeNull();
    });

    it('показывает ошибку смены пароля', async () => {
        server.use(
            http.post('http://localhost/api/auth/forgot-password', () =>
                HttpResponse.json({ message: 'Почта недоступна' }, { status: 500 })
            )
        );

        const user = userEvent.setup();
        await openSettings();
        await user.click(screen.getByRole('button', { name: 'Сменить пароль' }));

        expect(await screen.findByText('Почта недоступна')).not.toBeNull();
    });

    it('не удаляет теги без выбора', async () => {
        const user = userEvent.setup();
        await openSettings();
        await user.click(screen.getByRole('tab', { name: 'Управление тэгами' }));

        await user.click(await screen.findByRole('button', { name: 'Удалить' }));

        expect(await screen.findByText('Выберите тэги для удаления')).not.toBeNull();
    });

    it('частично удаляет теги, если часть запросов упала', async () => {
        server.use(
            http.delete('http://localhost/api/tags/:id', ({ params }) => (
                Number(params.id) === 1
                    ? new HttpResponse(null, { status: 204 })
                    : HttpResponse.json({ message: 'Не удалось' }, { status: 500 })
            ))
        );

        const user = userEvent.setup();
        await openSettings();
        await user.click(screen.getByRole('tab', { name: 'Управление тэгами' }));

        await user.click(await screen.findByRole('checkbox', { name: /Категория/ }));
        await user.click(screen.getByRole('checkbox', { name: /Фильтр/ }));
        await user.click(screen.getByRole('button', { name: 'Удалить' }));

        expect(await screen.findByText('Не удалось удалить тэгов: 1')).not.toBeNull();
        expect(screen.queryByRole('checkbox', { name: /Категория/ })).toBeNull();
        expect(screen.getByRole('checkbox', { name: /Фильтр/ })).not.toBeNull();
    });

    it('создаёт тег в настройках', async () => {
        const user = userEvent.setup();
        await openSettings();
        await user.click(screen.getByRole('tab', { name: 'Управление тэгами' }));

        await user.click(await screen.findByRole('button', { name: /Добавить тэг/ }));
        await user.type(screen.getByLabelText('Новый тэг'), 'Новый тег');
        await user.click(screen.getByRole('button', { name: 'Сохранить тэг' }));

        await waitFor(() => {
            expect(screen.getByText('Новый тег')).not.toBeNull();
        });
    });
});
