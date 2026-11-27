export function setPopoverVisible(trigger, popover, overlay, visible) {
    popover?.classList.toggle('show', visible);
    overlay?.classList.toggle('show', visible);
    popover?.setAttribute('aria-hidden', String(!visible));
    if (trigger) trigger.setAttribute('aria-expanded', String(visible));
}

export function positionPopover(popover, x, y) {
    if (!popover) return;

    const margin = 8;
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    popover.style.left = `${Math.min(Math.max(margin, x), maxLeft)}px`;
    popover.style.top = `${Math.min(Math.max(margin, y), maxTop)}px`;
}

export function focusFirstVisible(popover) {
    if (!popover) return;

    const target = [...popover.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].find((el) => {
        if (el.type === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 4 && rect.height > 4;
    });

    target?.focus({ preventScroll: true });
}

export function initPopover({
    trigger,
    popover,
    overlay,
    position,
    onOpen,
    signal,
}) {
    if (!trigger || !popover || !overlay) return null;

    trigger.setAttribute('aria-expanded', 'false');
    popover.setAttribute('aria-hidden', 'true');

    let open = false;

    const close = ({ restoreFocus = true } = {}) => {
        if (!open) return;
        open = false;
        setPopoverVisible(trigger, popover, overlay, false);
        if (restoreFocus) trigger.focus({ preventScroll: true });
    };

    const show = () => {
        if (open) return;
        open = true;
        setPopoverVisible(trigger, popover, overlay, true);
        position?.();
        onOpen?.();
    };

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        if (open) close();
        else show();
    });

    overlay.addEventListener('click', (event) => {
        event.preventDefault();
        close();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && open) close();
    }, { signal });

    return {
        close,
        isOpen: () => open,
    };
}
