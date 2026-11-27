import { screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderMain } from '../../src/pages/mainPage';
import { seedMain } from '../helpers';

describe('tag creation from add modal', () => {
    it('создаёт тег и добавляет его в форму', async () => {
        seedMain();
        const user = userEvent.setup();
        await renderMain();

        await user.click(screen.getByRole('button', { name: 'Добавить видео' }));
        const dialog = await screen.findByRole('dialog');

        await user.click(within(dialog).getByRole('button', { name: /Добавить тэг/ }));
        await user.type(within(dialog).getByLabelText('Новый тэг'), 'Новый тег');
        await user.click(within(dialog).getByRole('button', { name: 'Сохранить тэг' }));

        expect(await within(dialog).findByText('Новый тег')).not.toBeNull();
        expect(within(dialog).getByRole('checkbox', { name: /Новый тег/ })).not.toBeNull();
    });
});
