
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

let active = null;

function setVisible(windowEl, overlay, visible) {
    windowEl.classList.toggle('show', visible);
    overlay?.classList.toggle('show', visible);
    windowEl.setAttribute('aria-hidden', String(!visible));
}

export function openModal(windowEl, overlay = null, { onClose } = {}) {
    if (!windowEl) return;
    if (active?.windowEl === windowEl) return;
    if (active) closeModal(active.windowEl);

    const previousFocus = document.activeElement;

    if (!windowEl.hasAttribute('tabindex')) windowEl.setAttribute('tabindex', '-1');
    windowEl.setAttribute('role', 'dialog');
    windowEl.setAttribute('aria-modal', 'true');

    // Если в разметке нет aria-labelledby — связываем с заголовком окна.
    if (!windowEl.hasAttribute('aria-labelledby')) {
        const title = windowEl.querySelector('.title-text, .title-text-edit');
        if (title) {
            if (!title.id) title.id = `${windowEl.id || 'modal'}-title`;
            windowEl.setAttribute('aria-labelledby', title.id);
        }
    }

    const onKeydown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeModal(windowEl);
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = [...windowEl.querySelectorAll(FOCUSABLE_SELECTOR)]
            .filter((el) => el.getClientRects().length > 0);

        if (focusable.length === 0) {
            event.preventDefault();
            windowEl.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && (document.activeElement === first || document.activeElement === windowEl)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    document.addEventListener('keydown', onKeydown);
    active = { windowEl, overlay, previousFocus, onKeydown, onClose };

    setVisible(windowEl, overlay, true);

    const autofocus = windowEl.querySelector('[autofocus], [data-autofocus]');
    const field = [...windowEl.querySelectorAll('input, textarea, select')]
        .find((el) => el.type !== 'hidden' && el.getBoundingClientRect().width > 4);
    const focusTarget = autofocus || field || windowEl.querySelector('button') || windowEl;

    requestAnimationFrame(() => {
        if (windowEl.isConnected) focusTarget?.focus?.();
    });
}

export function closeModal(windowEl) {
    if (!active || active.windowEl !== windowEl) return;

    const { overlay, previousFocus, onKeydown, onClose } = active;
    document.removeEventListener('keydown', onKeydown);
    setVisible(windowEl, overlay, false);
    windowEl.removeAttribute('aria-modal');
    active = null;

    onClose?.();
    previousFocus?.focus?.();
}

export function closeAllModals() {
    if (!active) return;

    const { windowEl, overlay, onKeydown, onClose } = active;
    document.removeEventListener('keydown', onKeydown);
    setVisible(windowEl, overlay, false);
    windowEl.removeAttribute('aria-modal');
    active = null;

    onClose?.();
}
