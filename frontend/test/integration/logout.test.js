import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderMain } from '../../src/pages/mainPage';
import { seedMain } from '../helpers';

describe('logout', () => {
    it('очищает сессию, метаданные и фильтр', async () => {
        seedMain();
        await renderMain();

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Меню' }));
        await user.click(screen.getByRole('menuitem', { name: 'Выход' }));

        await waitFor(() => {
            expect(window.location.pathname).toBe('/login');
        });
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('yt_metadata:1')).toBeNull();
    });
});
