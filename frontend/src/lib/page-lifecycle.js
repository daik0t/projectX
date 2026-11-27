import { closeAllModals } from './modal';

/**
 * Контракт страниц: renderPage({ root, params }).
 * Страница не должна искать #app самостоятельно — корень приходит из роутера.
 */
let controller = new AbortController();

export function pageSignal() {
    return controller.signal;
}


export function resetPage() {
    closeAllModals();
    controller.abort();
    controller = new AbortController();

    const oldApp = document.getElementById('app');
    const freshApp = document.createElement('div');
    freshApp.id = 'app';

    if (oldApp) {
        oldApp.replaceWith(freshApp);
    } else {
        document.body.appendChild(freshApp);
    }

    return freshApp;
}
