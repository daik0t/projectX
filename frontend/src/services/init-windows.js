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

function onClick(id, handler) {
    const el = getContainer(id);
    if (!el) return;
    el.addEventListener("click", handler);
}

function setWindowVisible(windowEl, overlay, visible) {
    if (windowEl) windowEl.classList.toggle("show", visible);
    if (overlay) overlay.classList.toggle("show", visible);
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

    area.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        const isOpenAction = openBtns.includes(event.target) || openBtns.includes(clickedButton);

        if (!isOpenAction) return;

        event.preventDefault();
        setWindowVisible(windowEl, overlay, true);
    }, { signal: pageSignal() });

    windowEl.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        const isCloseAction = closeBtns.includes(event.target) || closeBtns.includes(clickedButton);

        if (!isCloseAction) return;

        event.preventDefault();
        setWindowVisible(windowEl, overlay, false);
    });
}

function openCloseWindow(windowId, overlayId, btnCloseId) {
    const closeIds = btnCloseId == null ? [] : (Array.isArray(btnCloseId) ? btnCloseId : [btnCloseId]);

    const windowEl = getContainer(windowId);
    if (!windowEl) return;

    const overlay = getContainer(overlayId);
    const closeBtns = closeIds.map(i => getContainer(i)).filter(Boolean);

    setWindowVisible(windowEl, overlay, true);

    windowEl.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        const isCloseAction = closeBtns.length > 0 &&
            (closeBtns.includes(event.target) || closeBtns.includes(clickedButton));

        if (!isCloseAction) return;

        event.preventDefault();
        setWindowVisible(windowEl, overlay, false);
    });

    if (overlay) {
        overlay.addEventListener('click', (event) => {
            event.preventDefault();
            setWindowVisible(windowEl, overlay, false);
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

    const hideActionWindow = () => setWindowVisible(actionWindow, actionWindowOverlay, false);

    area.addEventListener('dblclick', (event) => {
        const card = event.target.closest('.video-card');
        if (!card) return;

        event.preventDefault();

        const videoId = card.dataset.videoId;
        if (!videoId) return;

        currentVideoId = videoId;

        actionWindow.style.left = `${event.clientX + 5}px`;
        actionWindow.style.top  = `${event.clientY + 5}px`;

        setWindowVisible(actionWindow, actionWindowOverlay, true);
    }, { signal });

    window.addEventListener('click', (event) => {
        if (actionWindow.contains(event.target)) return;
        hideActionWindow();
    }, { signal });

    onClick('btn-action-add', hideActionWindow);

    onClick('btn-edit', async () => {
        if (!currentVideoId) return;

        hideActionWindow();
        removeWindow('edit-window');
        removeWindow('edit-window-overlay');

        try {
            const html = await renderEditWindow(user.accessToken, currentVideoId);
            area.insertAdjacentHTML('beforeend', html);

            if (!getContainer('edit-window')) {
                showToast('Не удалось открыть редактор', 'error');
                return;
            }

            initTagsList('edit-window-form', {
                onCreateTag: (name) => createTag(user.accessToken, { name }),
            });

            openCloseWindow("edit-window", "edit-window-overlay", ["btn-cancel-edit", "btn-close-edit"]);
            await editVideo(user.accessToken, currentVideoId);
        } catch (err) {
            console.error("[init-windows] edit failed:", err);
            showToast('Не удалось открыть редактор', 'error');
        }
    });

    onClick('btn-properties', async () => {
        if (!currentVideoId) return;

        hideActionWindow();
        removeWindow('properties-window');
        removeWindow('properties-window-overlay');

        const videoId = currentVideoId;
        currentVideoId = null;

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

        const url = getMetadata(currentVideoId)?.url;
        if (!url) {
            showToast('Ссылка на видео недоступна', 'error');
            hideActionWindow();
            return;
        }

        const title = getMetadata(currentVideoId)?.title ?? document.title;

        try {
            if (navigator.share) {
                await navigator.share({ title, url });
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                showToast('Ссылка скопирована');
            } else {
                showToast(url);
            }
            hideActionWindow();
        } catch (err) {
            if (err?.name === 'AbortError') return;
            console.error("[init-windows] share failed:", err);
            showToast('Не удалось поделиться ссылкой', 'error');
        }
    });

    onClick('btn-del', async () => {
        if (!currentVideoId) return;
        if (!confirm('Удалить это видео?')) return;

        const videoId = currentVideoId;
        currentVideoId = null;
        hideActionWindow();

        const videoList = getContainer('video-grid');
        await setupDeleteVideo({
            token: user.accessToken,
            id: videoId,
            onSuccess: async () => {
                if (videoList) await renderVideoList(videoList, user.accessToken);
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
        const isOpenAction = openBtns.includes(event.target) || openBtns.includes(clickedButton);

        if (!isOpenAction) return;

        event.preventDefault();
        setWindowVisible(windowEl, overlay, true);
    }, { signal: pageSignal() });

    overlay.addEventListener('click', (event) => {
        event.preventDefault();
        setWindowVisible(windowEl, overlay, false);
    });
}

export async function initDropdown(btnId, windowId, overlayId) {

    const btn = getContainer(btnId);
    const dropdown = getContainer(windowId);
    const overlay = getContainer(overlayId);

    if (!btn || !dropdown || !overlay) return;

    btn.addEventListener('click', (event) => {
        event.preventDefault();

        const rect = btn.getBoundingClientRect();

        const windowWidth = dropdown.offsetWidth;
        const targetLeft = rect.right - windowWidth;
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${targetLeft}px`;

        setWindowVisible(dropdown, overlay, true);
    });

    overlay.addEventListener('click', (event) => {
        event.preventDefault();
        setWindowVisible(dropdown, overlay, false);
    });
}

export async function initBoard(btnId, windowId, overlayId) {
    const btn = getContainer(btnId);
    const dropdown = getContainer(windowId);
    const overlay = getContainer(overlayId);

    if (!btn || !dropdown || !overlay) return;

    btn.addEventListener('click', (event) => {
        event.preventDefault();

        const rect = btn.getBoundingClientRect();

        const windowheight = dropdown.offsetHeight;

        dropdown.style.top = `${rect.top - windowheight}px`;

        setWindowVisible(dropdown, overlay, true);
    });

    overlay.addEventListener('click', (event) => {
        event.preventDefault();
        setWindowVisible(dropdown, overlay, false);
    });
}
