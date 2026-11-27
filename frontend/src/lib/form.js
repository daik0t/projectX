export function showFormMessage(el, text, type = 'info') {
    if (!el) return;

    if (!text) {
        el.hidden = true;
        el.textContent = '';
        return;
    }

    el.hidden = false;
    el.textContent = text;
    el.dataset.type = type;
}

export function setFormLoading(btn, loading, loadingText, idleText) {
    if (!btn) return;

    btn.disabled = Boolean(loading);
    btn.textContent = loading ? loadingText : idleText;
}
