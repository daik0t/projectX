import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderSettingsPage } from '../../src/pages/settingsPage';
import { seedSession } from '../helpers';

describe('settings page', () => {
    it('переключает вкладки и отправляет письмо для смены пароля', async () => {
        seedSession();
        const user = userEvent.setup();
        await renderSettingsPage();

        expect(await screen.findByText('Tester')).not.toBeNull();

        await user.click(screen.getByRole('tab', { name: 'Управление тэгами' }));
        expect(await screen.findByRole('button', { name: 'Удалить' })).not.toBeNull();

        await user.click(screen.getByRole('tab', { name: 'Профиль' }));
        await user.click(await screen.findByRole('button', { name: 'Сменить пароль' }));

        expect(await screen.findByText('Инструкции отправлены')).not.toBeNull();
    });

    it('удаляет выбранные теги', async () => {
        seedSession();
        const user = userEvent.setup();
        await renderSettingsPage();

        await user.click(await screen.findByRole('tab', { name: 'Управление тэгами' }));
        const checkbox = await screen.findByRole('checkbox', { name: /Категория/ });
        await user.click(checkbox);
        await user.click(screen.getByRole('button', { name: 'Удалить' }));

        await waitFor(() => {
            expect(screen.queryByRole('checkbox', { name: /Категория/ })).toBeNull();
        });
        expect(await screen.findByText('Тэги удалены')).not.toBeNull();
    });
});
