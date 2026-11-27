import { getContainer } from "./dom";
import { initBtnWindow, initDropdown, initBoard } from "./init-windows";
import { initActiveWindow } from "./video-actions";
import { renderVideoList } from "./render-video-list"
import { getAuth } from "../services/auth-storage"
import { logout } from "../services/auth-actions"
import { setupAddVideo } from "./add-video";
import { openPage } from "./open-page";
import { initTagsList } from "./add-tags";
import { createTag } from "../api/video";
import {
    initFilter,
    bindSidePanelTags,
    applySidebarTag,
    clearSidebarTag,
    getFilterState,
    getSidebarTagId,
    syncUI,
} from "./filter";
import { bindDropdownFilter } from "../components/dropdownFilter";
import { setupDeleteVideo } from "./delete-video";
import { escapeHtml } from "../lib/html";
import { buildBreadcrumb } from "../lib/breadcrumb";
import { showToast } from "../lib/ui";
import { pageSignal } from "../lib/page-lifecycle";

function setupBreadcrumb(profile, tags) {
    const input = getContainer('raw-path');
    if (!input) return;

    const update = () => {
        const { categoryTagId, filterTagIds } = getFilterState();
        input.value = buildBreadcrumb({
            displayName: profile?.displayName ?? getAuth()?.user?.displayName,
            tags,
            categoryTagId,
            filterTagIds,
        });
        input.title = input.value;
    };

    window.addEventListener('filter:applied', update, { signal: pageSignal() });
    update();
}

function renderSidebarTags(tags, videos) {
    const tagsRoot = getContainer('tags-list');
    const allButton = tagsRoot?.querySelector('#btn-all-tags');
    if (!tagsRoot || !allButton) return;

    const usedTags = new Map();

    (videos ?? []).forEach((video) => {
        (video?.tags ?? []).forEach((tag) => {
            const id = String(tag?.id ?? tag);
            if (!id) return;

            const name = typeof tag === 'object'
                ? String(tag.name ?? '')
                : (tags.find((item) => String(item.id) === id)?.name ?? '');
            usedTags.set(id, { id, name });
        });
    });

    const ordered = [];
    const seen = new Set();

    (tags ?? []).forEach((tag) => {
        const id = String(tag.id);
        if (!usedTags.has(id) || seen.has(id)) return;
        const used = usedTags.get(id);
        ordered.push({ id, name: used.name || tag.name || id });
        seen.add(id);
    });

    usedTags.forEach((tag) => {
        if (seen.has(tag.id)) return;
        ordered.push(tag);
        seen.add(tag.id);

        if (!tags.some((item) => String(item.id) === tag.id)) {
            tags.push({ id: tag.id, name: tag.name || tag.id });
        }
    });

    const categoryId = getSidebarTagId();
    if (categoryId && !usedTags.has(String(categoryId))) {
        clearSidebarTag();
        window.dispatchEvent(new CustomEvent('filter:applied'));
    }

    const currentIds = [...tagsRoot.querySelectorAll('.video-tag[data-tag-id]')]
        .map((button) => button.dataset.tagId);
    const nextIds = ordered.map((tag) => tag.id);
    const sameButtons = currentIds.length === nextIds.length
        && currentIds.every((id, index) => id === nextIds[index]);

    if (sameButtons) {
        syncUI(tagsRoot);
        return;
    }

    const hadFocus = tagsRoot.contains(document.activeElement);
    tagsRoot.querySelectorAll('.video-tag[data-tag-id]').forEach((button) => button.remove());

    allButton.insertAdjacentHTML('afterend', ordered.map((tag) => `
        <button class="video-tag" type="button"
            data-tag-id="${escapeHtml(tag.id)}"
            aria-pressed="false">>${escapeHtml(tag.name)}</button>
    `).join(''));

    bindSidePanelTags(tagsRoot);
    syncUI(tagsRoot);

    if (hadFocus) {
        tagsRoot.querySelector('.video-tag.active')?.focus({ preventScroll: true });
    }
}

function setupDragDelete() {
    const grid = getContainer('video-grid');
    const trash = getContainer('trash');
    if (!grid || !trash) return;

    const signal = pageSignal();
    let dropHandledRecently = false;

    const clearDragState = () => {
        grid.querySelectorAll('.video-card.dragging').forEach((card) => card.classList.remove('dragging'));
        trash.classList.remove('drag-over');
    };

    grid.addEventListener('dragstart', (event) => {
        const card = event.target.closest('.video-card');
        if (!card || !event.dataTransfer) return;

        event.dataTransfer.setData('text/plain', card.dataset.videoId);
        event.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
    }, { signal });

    grid.addEventListener('dragend', clearDragState, { signal });

    trash.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        trash.classList.add('drag-over');
    }, { signal });

    trash.addEventListener('dragleave', (event) => {
        if (event.relatedTarget && trash.contains(event.relatedTarget)) return;
        trash.classList.remove('drag-over');
    }, { signal });

    trash.addEventListener('drop', async (event) => {
        event.preventDefault();

        dropHandledRecently = true;
        setTimeout(() => { dropHandledRecently = false; }, 300);

        const id = event.dataTransfer?.getData('text/plain') ?? '';
        clearDragState();

        if (!/^\d+$/.test(id)) return;

        const card = grid.querySelector(`.video-card[data-video-id="${id}"]`);
        if (!card) return;

        card.classList.add('dragging');

        await setupDeleteVideo({
            id,
            onSuccess: async () => {
                showToast('Видео удалено');
                if (grid.isConnected) {
                    await renderVideoList(grid, getFilterState());
                }
            },
        });

        card.classList.remove('dragging');
    }, { signal });

    trash.addEventListener('click', () => {
        if (dropHandledRecently) return;
        showToast('Перетащите карточку видео на корзину, чтобы удалить её');
    }, { signal });
}

export async function initMainEvents(profile = null, tags = []) {

    const videoList = getContainer('video-grid');
    const signal = pageSignal();

    setupBreadcrumb(profile, tags);
    setupDragDelete();

    if (videoList) {
        initFilter({ container: videoList });

        videoList.addEventListener('video-list:loaded', (event) => {
            renderSidebarTags(tags, event.detail?.videos ?? []);
        }, { signal });

        await renderVideoList(videoList, getFilterState());
    }

    if (signal.aborted) return;

    initActiveWindow()
    initBtnWindow(["btn-add","btn-action-add"], "add-window", "add-window-overlay", ["btn-cancel", "btn-close"])
    initDropdown("btn-filter", "place-tags-filter", "place-tags-filter-overlay")
    initBoard("btn-home", "home-board", "home-board-overlay")

    if (signal.aborted) return;

    const btn = getContainer("btn-exit")
    btn?.addEventListener('click', logout)

    setupAddVideo({
    onSuccess: async () => {
        if (videoList) await renderVideoList(videoList, getFilterState());
    }
    });

    if (signal.aborted) return;

    const allTagsBtn = getContainer("btn-all-tags");
    allTagsBtn?.addEventListener('click', async () => {
        await applySidebarTag(null);
    }, { signal })

    if (getContainer("place-tags-filter")) {
        bindDropdownFilter();
    }

    openPage("btn-explorer", "/")
    openPage("btn-setting", "/settings")
}


