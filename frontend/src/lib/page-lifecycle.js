// Жизненный цикл страницы.
// При каждой навигации старый #app заменяется новым узлом: все слушатели,
// навешанные на элементы страницы, исчезают вместе с ним. Слушатели на
// window/document отменяются через AbortController (pageSignal).

import { closeAllModals } from './modal';

let controller = new AbortController();

/** Сигнал текущей страницы — передавать в addEventListener({ signal }). */
export function pageSignal() {
    return controller.signal;
}

/**
 * Начинает новую страницу: отменяет слушатели прошлой и возвращает
 * свежий #app. Вызывать из роутера перед рендером маршрута.
 */
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
