import { getContainer } from "./dom";
import { initActiveWindow, initBtnWindow, initDropdown , initBoard} from "./init-windows";
import {renderVideoList} from "./render-video-list"
import { clearAuth, getAuth } from "../services/auth-storage"
import { setupAddVideo } from "./add-video";
import { clearAllMetadata } from "./video-storage";
import { openPage} from "./open-page";
import { renderSettingsTags } from "../components/settingsTags";
import { initSettingsTagsDelete, initTagsList } from "./add-tags";
import { createTag } from "../api/video";
import { initFilter, bindSidePanelTags } from "./filter";
import { bindDropdownFilter, renderDropdownFilter } from "../components/dropdownFilter";
import { renderSettingsProfile, initSettingsProfile } from "../components/settingsProfile";

export async function initMainEvents(user) {
    
    const videoList = getContainer('video-grid');
    if (videoList) {
        await renderVideoList(videoList, user.accessToken);
    }

    initActiveWindow(user)
    await initBtnWindow(["btn-add","btn-action-add"], "add-window", "add-window-overlay", ["btn-cancel", "btn-close"])
    await initDropdown("btn-filter", "place-tags-filter", "place-tags-filter-overlay")
    initBoard("btn-home", "home-board", "home-board-overlay")

    const btn = getContainer("btn-exit")
    btn.addEventListener('click', clearAuth)

    await setupAddVideo({
    token: user.accessToken,
    onSuccess: async () => {
        if (videoList) await renderVideoList(videoList, user.accessToken);
    }
    });

    const btnchache = getContainer("btn-delete-chache")
    btnchache.addEventListener('click', clearAllMetadata)

    const videosContainer = getContainer("video-grid");
    initFilter({ container: videosContainer, token: user.accessToken });
    bindSidePanelTags();

    const ddHost = getContainer("place-tags-filter");
    if (ddHost) {
        ddHost.innerHTML = await renderDropdownFilter(user.accessToken);
        bindDropdownFilter();
    }

    await openPage("btn-setting", "/settings")
}   

export async function initSettingEvents() {
    const user = await getAuth();
    const token = user?.accessToken;

    // Одноразовые навигационные хэндлеры — кнопки пересоздаются при каждом рендере,
    // вешаем на новые DOM-элементы (openPage работает с текущим DOM)
    await openPage("btn-close-settings", "/");
    await openPage("btn-explorer", "/");

    // Делегирование — ОДИН раз на document, переживает перерисовки страницы
    if (!document.__settingsBound) {
        document.__settingsBound = true;
        document.addEventListener("click", onSettingsTabClick);
    }

    // При КАЖДОМ заходе открываем вкладку «Профиль» по умолчанию
    await openDefaultSettingsTab(token);
}

async function onSettingsTabClick(e) {
    const tab = e.target.closest("#tab-list .tab");
    if (!tab) return;

    const infoPlace = document.getElementById("information-place-settings");
    if (!infoPlace) return;                  // клик не на странице настроек

    e.preventDefault();

    document.querySelectorAll("#tab-list .tab")
        .forEach((b) => b.classList.toggle("active", b === tab));

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
        infoPlace.innerHTML = `<p class="error">Ошибка: ${err.message}</p>`;
    }
}

async function openDefaultSettingsTab(token) {
    const infoPlace = document.getElementById("information-place-settings");
    const tabList = document.getElementById("tab-list");
    if (!infoPlace || !tabList) return;       // не на странице настроек

    tabList.querySelectorAll(".tab")
        .forEach((b) => b.classList.toggle("active", b.id === "tab-profile"));

    try {
        infoPlace.innerHTML = await renderSettingsProfile(token);
        initSettingsProfile();
    } catch (err) {
        console.error("[settings] profile render failed:", err);
        infoPlace.innerHTML = `<p class="error">Ошибка: ${err.message}</p>`;
    }
}