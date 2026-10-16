import { router } from './routers.js';

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