

export function socialAuthRender() {
    return (`
            <div class = "auth-widget-socials">
                <button type="button" class="auth-widget-btn btn-social" data-provider="google">
                    <img src="https://img.icons8.ru/?size=30&id=17949&format=png&color=000000">
                </button>
                <button type="button" class="auth-widget-btn btn-social" data-provider="github">
                    <img src="https://img.icons8.ru/?size=30&id=12599&format=png&color=000000">
                </button>
            </div>
    `)
}

export function setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('is-loading', loading);
    btn.disabled = loading;
}

export function getProviderButton(container, provider) {
    return container?.querySelector(`[data-provider="${provider}"]`) ?? null;
}


/**
 * Вставляет блок кнопок и подписывается на клики.
 * @param {HTMLElement} container
 * @param {{ onSuccess?: (data) => void, onError?: (err) => void }} handlers
 * @param {Record<string, (container, handlers) => void>} providers — карта обработчиков по имени провайдера
 * @returns {{ destroy: () => void }}
 */
export function mountSocialAuth(container, handlers = {}, providers = {}) {
    if (!container) throw new Error('mountSocialAuth: контейнер не найден');

    container.innerHTML = socialAuthRender();

    const listeners = [];

    container.querySelectorAll('[data-provider]').forEach((btn) => {
        const name = btn.dataset.provider;
        const handler = providers[name];

        if (typeof handler !== 'function') {
            console.warn(`mountSocialAuth: обработчик для "${name}" не передан`);
            return;
        }

        const onClick = () => handler(container, handlers);
        btn.addEventListener('click', onClick);
        listeners.push(() => btn.removeEventListener('click', onClick));
    });

    return {
        destroy() {
            listeners.forEach((off) => off());
            container.innerHTML = '';
        }
    };
}