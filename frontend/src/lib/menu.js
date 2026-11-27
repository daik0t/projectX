export function initMenuKeyboard(menu, { signal } = {}) {
    if (!menu) return;

    menu.addEventListener('keydown', (event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

        const items = [...menu.querySelectorAll('[role="menuitem"]:not([disabled])')];
        if (items.length === 0) return;

        event.preventDefault();

        const current = items.indexOf(document.activeElement);
        let next;

        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length;
        else next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;

        items[next].focus({ preventScroll: true });
    }, { signal });
}
