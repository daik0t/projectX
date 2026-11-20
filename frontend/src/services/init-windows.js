import { getContainer } from "./dom";
import { renderEditWindow } from "../components/editWindow";
import { setupDeleteVideo } from "./delete-video";
import { renderVideoList } from "./render-video-list";
import { editVideo } from "./edit-action";
import { renderPropertiesWindow } from "../components/propertiesWindow";
import { getMetadata } from "./video-storage";
import { initTagsList } from "./add-tags";
import { createTag } from "../api/video";
import { showToast } from "../lib/ui";
import { pageSignal } from "../lib/page-lifecycle";
import { openModal, closeModal } from "../lib/modal";
import { getAppliedTagIds } from "./filter";

function onClick(id, handler) {
    const el = getContainer(id);
    if (!el) return;
    el.addEventListener("click", handler);
}

function setPopoverVisible(trigger, popover, overlay, visible) {
    popover?.classList.toggle("show", visible);
    overlay?.classList.toggle("show", visible);
    popover?.setAttribute("aria-hidden", String(!visible));
    if (trigger) trigger.setAttribute("aria-expanded", String(visible));
}

function positionPopover(popover, x, y) {
    if (!popover) return;

    const margin = 8;
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    popover.style.left = `${Math.min(Math.max(margin, x), maxLeft)}px`;
    popover.style.top = `${Math.min(Math.max(margin, y), maxTop)}px`;
}

export async function initBtnWindow(btnOpenId, windowId, overlayId, btnCloseId) {

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

function openCloseWindow(windowId, overlayId, btnCloseId) {
    const closeIds = btnCloseId == null ? [] : (Array.isArray(btnCloseId) ? btnCloseId : [btnCloseId]);

    const windowEl = getContainer(windowId);
    if (!windowEl) return;

    const overlay = getContainer(overlayId);
    const closeBtns = closeIds.map(i => getContainer(i)).filter(Boolean);

    openModal(windowEl, overlay);

    windowEl.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        const isCloseAction = closeBtns.some((btn) => btn === event.target || btn === clickedButton);
        if (!isCloseAction) return;

        event.preventDefault();
        closeModal(windowEl);
    });

    if (overlay) {
        overlay.addEventListener('click', (event) => {
            event.preventDefault();
            closeModal(windowEl);
        });
    }
}

function removeWindow(id) {
    document.getElementById(id)?.remove();
}

export async function initActiveWindow(user) {

    const area = getContainer('app');
    const actionWindow = getContainer('action-window');
    const actionWindowOverlay = getContainer('action-window-overlay');

    if (!area || !actionWindow || !actionWindowOverlay) return;

    const signal = pageSignal();
    let currentVideoId = null;
    let lastTrigger = null;

    const hideActionWindow = (restoreFocus = false) => {
        if (!actionWindow.classList.contains('show')) return;
        setPopoverVisible(null, actionWindow, actionWindowOverlay, false);
        if (restoreFocus && lastTrigger && document.contains(lastTrigger)) {
            lastTrigger.focus({ preventScroll: true });
        }
        lastTrigger = null;
    };

    const openActionWindow = (card, x, y) => {
        const videoId = card?.dataset.videoId ?? null;
        if (card && !videoId) return;

        const hasCard = Boolean(videoId);
        currentVideoId = videoId;
        lastTrigger = card ?? null;

        const addButton = getContainer('btn-action-add');
        if (addButton) addButton.disabled = hasCard;

        ['btn-edit', 'btn-properties', 'btn-share', 'btn-del'].forEach((id) => {
            const button = getContainer(id);
            if (button) button.disabled = !hasCard;
        });

        setPopoverVisible(null, actionWindow, actionWindowOverlay, true);
        positionPopover(actionWindow, x + 5, y + 5);
        actionWindow.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
    };

    const isInteractiveTarget = (target) => Boolean(target.closest(
        'button, input, textarea, select, a, form, .action-window, .home-board, ' +
        '.place-tags-filter, .add-window, .edit-window, .properties-window, .toast-host'
    ));

    let pressTimer = null;
    let pressOrigin = null;
    let pressCard = null;
    let pressActive = false;
    let longPressFired = false;
    let longPressResetTimer = null;
    let suppressClick = false;

    const cancelLongPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        pressOrigin = null;
        pressCard = null;
        pressActive = false;
    };

    const scheduleClickGuardReset = () => {
        clearTimeout(longPressResetTimer);
        longPressResetTimer = setTimeout(() => {
            longPressFired = false;
            suppressClick = false;
        }, 900);
    };

    area.addEventListener('contextmenu', (event) => {
        const card = event.target.closest('.video-card:not(.skeleton-card)');

        if (!card && isInteractiveTarget(event.target)) return;

        event.preventDefault();
        cancelLongPress();

        if (longPressFired) {
            longPressFired = false;
            return;
        }

        suppressClick = event.pointerType === 'touch' || event.pointerType === 'pen';
        if (suppressClick) scheduleClickGuardReset();
        openActionWindow(card, event.clientX, event.clientY);
    }, { signal });

    area.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;

        const card = event.target.closest('.video-card:not(.skeleton-card)');
        if (!card && isInteractiveTarget(event.target)) return;

        cancelLongPress();
        longPressFired = false;
        pressActive = true;
        pressCard = card;
        pressOrigin = { x: event.clientX, y: event.clientY };

        pressTimer = setTimeout(() => {
            pressTimer = null;
            if (!pressActive || !pressOrigin) return;

            longPressFired = true;
            suppressClick = true;
            openActionWindow(pressCard, pressOrigin.x, pressOrigin.y);

            scheduleClickGuardReset();
        }, 500);
    }, { signal });

    area.addEventListener('pointermove', (event) => {
        if (!pressTimer || !pressOrigin) return;

        const distance = Math.hypot(
            event.clientX - pressOrigin.x,
            event.clientY - pressOrigin.y
        );
        if (distance > 10) cancelLongPress();
    }, { signal });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => {
        area.addEventListener(type, cancelLongPress, { signal });
    });

    area.addEventListener('dragstart', cancelLongPress, { signal });

    signal.addEventListener('abort', () => {
        cancelLongPress();
        clearTimeout(longPressResetTimer);
    });

    area.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        const card = event.target.closest('.video-card:not(.skeleton-card)');
        if (!card) return;

        event.preventDefault();
        const rect = card.getBoundingClientRect();
        openActionWindow(card, rect.left + 16, rect.top + 16);
    }, { signal });

    window.addEventListener('click', (event) => {
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        if (actionWindow.contains(event.target)) return;
        hideActionWindow();
    }, { signal });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') hideActionWindow(true);
    }, { signal });

    onClick('btn-action-add', () => hideActionWindow(true));

    onClick('btn-edit', async () => {
        if (!currentVideoId) return;

        const videoId = currentVideoId;
        hideActionWindow(true);
        removeWindow('edit-window');
        removeWindow('edit-window-overlay');

        try {
            const html = await renderEditWindow(user.accessToken, videoId);
            area.insertAdjacentHTML('beforeend', html);

            if (!getContainer('edit-window')) {
                showToast('Не удалось открыть редактор', 'error');
                return;
            }

            initTagsList('edit-window-form', {
                onCreateTag: (name) => createTag(user.accessToken, { name }),
            });

            openCloseWindow("edit-window", "edit-window-overlay", ["btn-cancel-edit", "btn-close-edit"]);
            await editVideo(user.accessToken, videoId);
        } catch (err) {
            console.error("[init-windows] edit failed:", err);
            showToast('Не удалось открыть редактор', 'error');
        }
    });

    onClick('btn-properties', async () => {
        if (!currentVideoId) return;

        const videoId = currentVideoId;
        hideActionWindow(true);
        currentVideoId = null;
        removeWindow('properties-window');
        removeWindow('properties-window-overlay');

        try {
            const html = await renderPropertiesWindow(videoId);
            area.insertAdjacentHTML('beforeend', html);
            openCloseWindow('properties-window', 'properties-window-overlay', 'btn-close-properties');
        } catch (err) {
            console.error("[init-windows] properties failed:", err);
            showToast('Не удалось открыть свойства', 'error');
        }
    });

    onClick('btn-share', async (event) => {
        event.stopPropagation();
        if (!currentVideoId) return;

        const meta = getMetadata(currentVideoId);
        const url = meta?.url;
        if (!url) {
            showToast('Ссылка на видео недоступна', 'error');
            hideActionWindow(true);
            return;
        }

        try {
            if (navigator.share) {
                await navigator.share({ title: meta?.title ?? document.title, url });
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                showToast('Ссылка скопирована');
            } else {
                showToast(url);
            }
            hideActionWindow(true);
        } catch (err) {
            if (err?.name === 'AbortError') {
                hideActionWindow(true);
                return;
            }
            console.error("[init-windows] share failed:", err);
            showToast('Не удалось поделиться ссылкой', 'error');
        }
    });

    onClick('btn-del', async () => {
        if (!currentVideoId) return;
        if (!confirm('Удалить это видео?')) return;

        const videoId = currentVideoId;
        currentVideoId = null;
        hideActionWindow(true);

        const videoList = getContainer('video-grid');
        await setupDeleteVideo({
            token: user.accessToken,
            id: videoId,
            onSuccess: async () => {
                if (videoList) await renderVideoList(videoList, user.accessToken, getAppliedTagIds());
            },
        });
    });
}

export async function initWindow(btnOpenId, windowId, overlayId) {
    const openIds = Array.isArray(btnOpenId) ? btnOpenId : [btnOpenId];

    const area = getContainer('app');
    const openBtns = openIds.map(i => getContainer(i)).filter(Boolean);
    const windowEl = getContainer(windowId);
    const overlay = getContainer(overlayId);

    if (!area || !windowEl || !overlay || openBtns.length === 0) return;

    area.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        const trigger = openBtns.find((btn) => btn === event.target || btn === clickedButton);
        if (!trigger) return;

        event.preventDefault();
        openModal(windowEl, overlay);
    }, { signal: pageSignal() });

    overlay.addEventListener('click', (event) => {
        event.preventDefault();
        closeModal(windowEl);
    });
}

export async function initDropdown(btnId, windowId, overlayId) {

    const btn = getContainer(btnId);
    const dropdown = getContainer(windowId);
    const overlay = getContainer(overlayId);

    if (!btn || !dropdown || !overlay) return;

    btn.setAttribute('aria-expanded', 'false');
    if (!dropdown.hasAttribute('aria-label')) dropdown.setAttribute('aria-label', 'Фильтр по тегам');
    dropdown.setAttribute('aria-hidden', 'true');

    const close = () => setPopoverVisible(btn, dropdown, overlay, false);

    btn.addEventListener('click', (event) => {
        event.preventDefault();

        const rect = btn.getBoundingClientRect();
        setPopoverVisible(btn, dropdown, overlay, true);
        positionPopover(dropdown, rect.right - dropdown.offsetWidth, rect.bottom + 5);

        dropdown.querySelector('input')?.focus({ preventScroll: true });
    });

    overlay.addEventListener('click', (event) => {
        event.preventDefault();
        close();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') close();
    }, { signal: pageSignal() });
}

export async function initBoard(btnId, windowId, overlayId) {
    const btn = getContainer(btnId);
    const board = getContainer(windowId);
    const overlay = getContainer(overlayId);

    if (!btn || !board || !overlay) return;

    btn.setAttribute('aria-expanded', 'false');
    board.setAttribute('aria-hidden', 'true');

    const close = () => setPopoverVisible(btn, board, overlay, false);

    btn.addEventListener('click', (event) => {
        event.preventDefault();

        const rect = btn.getBoundingClientRect();
        setPopoverVisible(btn, board, overlay, true);
        positionPopover(board, rect.left, rect.top - board.offsetHeight - 5);

        board.querySelector('button')?.focus({ preventScroll: true });
    });

    overlay.addEventListener('click', (event) => {
        event.preventDefault();
        close();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') close();
    }, { signal: pageSignal() });
}
