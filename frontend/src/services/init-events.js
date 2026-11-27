import { getContainer } from "./dom";
import { initActiveWindow, initBtnWindow, initDropdown , initBoard} from "./init-windows";
import { renderVideoList } from "./render-video-list"
import { getAuth } from "../services/auth-storage"
import { logout } from "../services/auth-actions"
import { setupAddVideo } from "./add-video";
import { openPage } from "./open-page";
import { renderSettingsTags } from "../components/settingsTags";
import { initSettingsTagsDelete, initTagsList } from "./add-tags";
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
import { renderSettingsProfile, initSettingsProfile } from "../components/settingsProfile";
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

function setupDragDelete(user) {
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
            token: user.accessToken,
            id,
            onSuccess: async () => {
                showToast('Видео удалено');
                if (grid.isConnected) {
                    await renderVideoList(grid, user.accessToken, getFilterState());
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

export async function initMainEvents(user, profile = null, tags = []) {

    const videoList = getContainer('video-grid');
    const signal = pageSignal();

    setupBreadcrumb(profile, tags);
    setupDragDelete(user);

    if (videoList) {
        initFilter({ container: videoList, token: user.accessToken });

        videoList.addEventListener('video-list:loaded', (event) => {
            renderSidebarTags(tags, event.detail?.videos ?? []);
        }, { signal });

        await renderVideoList(videoList, user.accessToken, getFilterState());
    }

    if (signal.aborted) return;

    initActiveWindow(user)
    await initBtnWindow(["btn-add","btn-action-add"], "add-window", "add-window-overlay", ["btn-cancel", "btn-close"])
    await initDropdown("btn-filter", "place-tags-filter", "place-tags-filter-overlay")
    initBoard("btn-home", "home-board", "home-board-overlay")

    if (signal.aborted) return;

    const btn = getContainer("btn-exit")
    btn?.addEventListener('click', logout)

    await setupAddVideo({
    token: user.accessToken,
    onSuccess: async () => {
        if (videoList) await renderVideoList(videoList, user.accessToken, getFilterState());
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

    await openPage("btn-explorer", "/")
    await openPage("btn-setting", "/settings")
}

export async function initSettingEvents() {
    const signal = pageSignal();
    const user = getAuth();
    const token = user?.accessToken;

    await openPage("btn-close-settings", "/");
    await openPage("btn-explorer", "/");

    if (signal.aborted) return;

    initBoard("btn-home", "home-board", "home-board-overlay");

    getContainer("btn-exit")?.addEventListener("click", logout);

    if (!document.__settingsBound) {
        document.__settingsBound = true;
        document.addEventListener("click", onSettingsTabClick);
    }

    // Клавиатурная навигация по вкладкам.
    const tabList = document.getElementById("tab-list");
    tabList?.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

        const tabs = [...tabList.querySelectorAll('[role="tab"]')];
        const index = tabs.indexOf(document.activeElement);
        if (index === -1) return;

        event.preventDefault();
        const offset = event.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(index + offset + tabs.length) % tabs.length];
        next.focus();
        next.click();
    }, { signal });

    await openDefaultSettingsTab(token);
}

async function onSettingsTabClick(e) {
    const tab = e.target.closest("#tab-list .tab");
    if (!tab) return;

    const infoPlace = document.getElementById("information-place-settings");
    if (!infoPlace) return;

    e.preventDefault();

    document.querySelectorAll("#tab-list .tab").forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
    });

    const token = getAuth()?.accessToken;

    try {
        if (tab.id === "tab-tags") {
            const html = await renderSettingsTags(token);
            if (!infoPlace.isConnected) return;
            infoPlace.innerHTML = html;

            const placeTags = document.getElementById("place-tags-settings");
            if (placeTags) {
                initTagsList(placeTags, {
                    onCreateTag: (name) => createTag(token, { name }),
                });
                initSettingsTagsDelete(token);
            }
        } else if (tab.id === "tab-profile") {
            const html = await renderSettingsProfile(token);
            if (!infoPlace.isConnected) return;
            infoPlace.innerHTML = html;
            initSettingsProfile(token);
        }
    } catch (err) {
        if (!infoPlace.isConnected) return;
        console.error("[settings] tab render failed:", err);
        infoPlace.innerHTML = `<p class="error">Ошибка: ${escapeHtml(err.message)}</p>`;
    }
}

async function openDefaultSettingsTab(token) {
    const infoPlace = document.getElementById("information-place-settings");
    const tabList = document.getElementById("tab-list");
    if (!infoPlace || !tabList) return;

    tabList.querySelectorAll(".tab").forEach((button) => {
        const isActive = button.id === "tab-profile";
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
    });

    try {
        const html = await renderSettingsProfile(token);
        if (!infoPlace.isConnected) return;
        infoPlace.innerHTML = html;
        initSettingsProfile(token);
    } catch (err) {
        if (!infoPlace.isConnected) return;
        console.error("[settings] profile render failed:", err);
        infoPlace.innerHTML = `<p class="error">Ошибка: ${escapeHtml(err.message)}</p>`;
    }
}
