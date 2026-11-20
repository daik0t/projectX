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
    getAppliedTagIds,
} from "./filter";
import { bindDropdownFilter } from "../components/dropdownFilter";
import { renderSettingsProfile, initSettingsProfile } from "../components/settingsProfile";
import { setupDeleteVideo } from "./delete-video";
import { escapeHtml } from "../lib/html";
import { buildBreadcrumb } from "../lib/breadcrumb";
import { showToast } from "../lib/ui";
import { pageSignal } from "../lib/page-lifecycle";

/** Поиск по уже отрисованным карточкам (по названию из кэша метаданных). */
/*function setupSearch() {
    const input = getContainer('search-input');
    const grid = getContainer('video-grid');
    if (!input || !grid) return;

    const apply = () => {
        const query = input.value.trim().toLowerCase();
        let visible = 0;

        grid.querySelectorAll('.video-card:not(.skeleton-card)').forEach((card) => {
            const title = (card.dataset.title || '').toLowerCase();
            const match = !query || title.includes(query);
            card.hidden = !match;
            if (match) visible += 1;
        });

        const hasCards = Boolean(grid.querySelector('.video-card:not(.skeleton-card)'));
        let empty = grid.querySelector('.search-empty');

        if (query && hasCards && visible === 0) {
            if (!empty) {
                empty = document.createElement('p');
                empty.className = 'search-empty';
                empty.textContent = 'Ничего не найдено';
                grid.appendChild(empty);
            }
        } else {
            empty?.remove();
        }
    };

    input.addEventListener('input', apply, { signal: pageSignal() });
    grid.addEventListener('video-list:rendered', apply, { signal: pageSignal() });
    apply();
}*/

/**
 * Хлебные крошки в raw-path:
 * Имя_пользователя>видео>тег1_тег2>поисковой_запрос
 */
function setupBreadcrumb(profile, tags) {
    const input = getContainer('raw-path');
    if (!input) return;

    const search = getContainer('search-input');

    const update = () => {
        input.value = buildBreadcrumb({
            displayName: profile?.displayName ?? getAuth()?.user?.displayName,
            tags,
            appliedTagIds: getAppliedTagIds(),
            query: search?.value ?? '',
        });
        input.title = input.value;
    };

    window.addEventListener('filter:applied', update, { signal: pageSignal() });
    search?.addEventListener('input', update, { signal: pageSignal() });
    update();
}

/** Перетаскивание карточки на корзину удаляет видео. */
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
                    await renderVideoList(grid, user.accessToken, getAppliedTagIds());
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

    setupBreadcrumb(profile, tags);
    setupDragDelete(user);

    if (videoList) {
        await renderVideoList(videoList, user.accessToken, getAppliedTagIds());
    }

    initActiveWindow(user)
    await initBtnWindow(["btn-add","btn-action-add"], "add-window", "add-window-overlay", ["btn-cancel", "btn-close"])
    await initDropdown("btn-filter", "place-tags-filter", "place-tags-filter-overlay")
    initBoard("btn-home", "home-board", "home-board-overlay")

    const btn = getContainer("btn-exit")
    btn?.addEventListener('click', logout)

    await setupAddVideo({
    token: user.accessToken,
    onSuccess: async () => {
        if (videoList) await renderVideoList(videoList, user.accessToken, getAppliedTagIds());
    }
    });

    const videosContainer = getContainer("video-grid");
    initFilter({ container: videosContainer, token: user.accessToken });
    bindSidePanelTags();
    //setupSearch();

    const allTagsBtn = getContainer("btn-all-tags");
    allTagsBtn?.addEventListener('click', async () => {
        await applySidebarTag(null);
    }, { signal: pageSignal() })

    if (getContainer("place-tags-filter")) {
        bindDropdownFilter();
    }

    await openPage("btn-explorer", "/")
    await openPage("btn-setting", "/settings")
}

export async function initSettingEvents() {
    const user = await getAuth();
    const token = user?.accessToken;

    await openPage("btn-close-settings", "/");
    await openPage("btn-explorer", "/");

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
    }, { signal: pageSignal() });

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
            infoPlace.innerHTML = await renderSettingsTags(token);

            const placeTags = document.getElementById("place-tags-settings");
            if (placeTags) {
                initTagsList(placeTags, {
                    onCreateTag: (name) => createTag(token, { name }),
                });
                initSettingsTagsDelete(token);
            }
        } else if (tab.id === "tab-profile") {
            infoPlace.innerHTML = await renderSettingsProfile(token);
            initSettingsProfile(token);
        }
    } catch (err) {
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
        infoPlace.innerHTML = await renderSettingsProfile(token);
        initSettingsProfile(token);
    } catch (err) {
        console.error("[settings] profile render failed:", err);
        infoPlace.innerHTML = `<p class="error">Ошибка: ${escapeHtml(err.message)}</p>`;
    }
}
