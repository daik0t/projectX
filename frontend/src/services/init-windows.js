import { getContainer } from "./dom";
import { pageSignal } from "../lib/page-lifecycle";
import { openModal, closeModal } from "../lib/modal";
import { initPopover, focusFirstVisible, positionPopover } from "../lib/popover";
import { initMenuKeyboard } from "../lib/menu";

export function initBtnWindow(btnOpenId, windowId, overlayId, btnCloseId) {
    const openIds = Array.isArray(btnOpenId) ? btnOpenId : [btnOpenId];
    const closeIds = Array.isArray(btnCloseId) ? btnCloseId : [btnCloseId];

    const area = getContainer('app');
    const openBtns = openIds.map(i => getContainer(i)).filter(Boolean);
    const windowEl = getContainer(windowId);
    const overlay = getContainer(overlayId);
    const closeBtns = closeIds.map(i => getContainer(i)).filter(Boolean);

    if (!area || !windowEl || !overlay || openBtns.length === 0) return;

    const close = () => {
        closeModal(windowEl);
        openBtns.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
    };

    area.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        const trigger = openBtns.find((btn) => btn === event.target || btn === clickedButton);
        if (!trigger) return;

        event.preventDefault();
        trigger.setAttribute('aria-expanded', 'true');
        openModal(windowEl, overlay, {
            onClose: () => openBtns.forEach((btn) => btn.setAttribute('aria-expanded', 'false')),
        });
    }, { signal: pageSignal() });

    windowEl.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        const isCloseAction = closeBtns.some((btn) => btn === event.target || btn === clickedButton);
        if (!isCloseAction) return;

        event.preventDefault();
        close();
    });

    overlay.addEventListener('click', close);
}

export function initDropdown(btnId, windowId, overlayId) {
    const btn = getContainer(btnId);
    const dropdown = getContainer(windowId);
    const overlay = getContainer(overlayId);

    if (!btn || !dropdown || !overlay) return;

    if (!dropdown.hasAttribute('aria-label')) dropdown.setAttribute('aria-label', 'Фильтр по тегам');

    initPopover({
        trigger: btn,
        popover: dropdown,
        overlay,
        signal: pageSignal(),
        position: () => {
            const rect = btn.getBoundingClientRect();
            positionPopover(dropdown, rect.right - dropdown.offsetWidth, rect.bottom + 5);
        },
        onOpen: () => focusFirstVisible(dropdown),
    });
}

export function initBoard(btnId, windowId, overlayId) {
    const btn = getContainer(btnId);
    const board = getContainer(windowId);
    const overlay = getContainer(overlayId);

    if (!btn || !board || !overlay) return;

    const signal = pageSignal();
    initMenuKeyboard(board, { signal });

    initPopover({
        trigger: btn,
        popover: board,
        overlay,
        signal,
        position: () => {
            const rect = btn.getBoundingClientRect();
            positionPopover(board, rect.left, rect.top - board.offsetHeight - 5);
        },
        onOpen: () => focusFirstVisible(board),
    });
}
