import './styles/index.css';
import { AUTH_EVENT } from './api/api';
import { resetFilter } from './services/filter';
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
    const link = e.target.closest('a[data-link]');
    if (!link) return;
    e.preventDefault();
    if (link.pathname === window.location.pathname) return;
    history.pushState({}, '', link.href);
    router();
});

window.addEventListener('popstate', router);
router();
