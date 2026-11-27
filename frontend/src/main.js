import './styles/index.css';
import { AUTH_EVENT } from './api/api';
import { resetFilter } from './services/filter';
import { navigate } from './lib/navigation';
import { router } from './routers.js';

let authRedirecting = false;

window.addEventListener(AUTH_EVENT, () => {
    if (authRedirecting || window.location.pathname === '/login') return;

    authRedirecting = true;
    resetFilter();
    history.replaceState({}, '', '/login');

    Promise.resolve(router()).finally(() => {
        authRedirecting = false;
    });
});

document.addEventListener('click', (e) => {
    if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
    ) return;

    const link = e.target.closest('a[data-link]');
    if (!link || link.target || link.hasAttribute('download')) return;

    e.preventDefault();
    navigate(`${link.pathname}${link.search}${link.hash}`);
});

window.addEventListener('popstate', router);
router();
