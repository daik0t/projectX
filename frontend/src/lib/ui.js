let toastTimer = null;

/**
 * Короткое уведомление внизу экрана.
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 */
export function showToast(message, type = 'info') {
    let host = document.getElementById('toast-host');

    if (!host) {
        host = document.createElement('div');
        host.id = 'toast-host';
        host.className = 'toast-host';
        host.setAttribute('aria-live', 'polite');
        document.body.appendChild(host);
    }

    host.replaceChildren();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    host.appendChild(toast);

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => host.replaceChildren(), 3000);
}
