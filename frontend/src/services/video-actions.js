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
import { setPopoverVisible, positionPopover } from "../lib/popover";
import { initMenuKeyboard } from "../lib/menu";
import { getFilterState } from "./filter";

function onClick(id, handler, root = document) {
    const el = getContainer(id, root);
    if (!el) return;
    el.addEventListener("click", handler);
}

function openCloseWindow(windowId, overlayId, btnCloseId, root = document) {
    const closeIds = btnCloseId == null ? [] : (Array.isArray(btnCloseId) ? btnCloseId : [btnCloseId]);

    const windowEl = getContainer(windowId, root);
    if (!windowEl) return;

    const overlay = getContainer(overlayId, root);
    const closeBtns = closeIds.map(i => getContainer(i, root)).filter(Boolean);

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

function removeWindow(id, root = document) {
    getContainer(id, root)?.remove();
}

export function initActiveWindow(root = document) {
    const area = root;
    const actionWindow = getContainer('action-window', root);
    const actionWindowOverlay = getContainer('action-window-overlay', root);

    if (!area || !actionWindow || !actionWindowOverlay) return;

    const signal = pageSignal();
    initMenuKeyboard(actionWindow, { signal });
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
        lastTrigger = card ?? getContainer('btn-add', root);

        const addButton = getContainer('btn-action-add', root);
        if (addButton) addButton.disabled = hasCard;

        ['btn-edit', 'btn-properties', 'btn-share', 'btn-del'].forEach((id) => {
            const button = getContainer(id, root);
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

    onClick('btn-action-add', () => hideActionWindow(true), root);

    onClick('btn-edit', async () => {
        if (!currentVideoId) return;

        const videoId = currentVideoId;
        hideActionWindow(true);
        removeWindow('edit-window', root);
        removeWindow('edit-window-overlay', root);

        try {
            const html = await renderEditWindow(videoId);
            area.insertAdjacentHTML('beforeend', html);

            if (!getContainer('edit-window', root)) {
                showToast('Не удалось открыть редактор', 'error');
                return;
            }

            initTagsList(getContainer('edit-window-form', root), {
                onCreateTag: (name) => createTag({ name }),
            });

            openCloseWindow("edit-window", "edit-window-overlay", ["btn-cancel-edit", "btn-close-edit"], root);
            await editVideo(videoId, root);
        } catch (err) {
            console.error("[video-actions] edit failed:", err);
            showToast('Не удалось открыть редактор', 'error');
        }
    }, root);

    onClick('btn-properties', async () => {
        if (!currentVideoId) return;

        const videoId = currentVideoId;
        hideActionWindow(true);
        currentVideoId = null;
        removeWindow('properties-window', root);
        removeWindow('properties-window-overlay', root);

        try {
            const html = renderPropertiesWindow(videoId);
            area.insertAdjacentHTML('beforeend', html);
            openCloseWindow('properties-window', 'properties-window-overlay', 'btn-close-properties', root);
        } catch (err) {
            console.error("[video-actions] properties failed:", err);
            showToast('Не удалось открыть свойства', 'error');
        }
    }, root);

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
            console.error("[video-actions] share failed:", err);
            showToast('Не удалось поделиться ссылкой', 'error');
        }
    }, root);

    onClick('btn-del', async () => {
        if (!currentVideoId) return;
        if (!confirm('Удалить это видео?')) return;

        const videoId = currentVideoId;
        currentVideoId = null;
        hideActionWindow(true);

        const videoList = getContainer('video-grid', root);
        await setupDeleteVideo({
            id: videoId,
            onSuccess: async () => {
                if (videoList) await renderVideoList(videoList, getFilterState());
            },
        });
    }, root);
}
