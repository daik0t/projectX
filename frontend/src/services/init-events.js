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
    const user  = await getAuth()
    const place = getContainer("information-place-settings")
    await openPage("btn-close-settings", "/")
    await openPage("btn-explorer", "/")
    const btnSetTag = getContainer('tab-tags')
    btnSetTag.addEventListener('click', async (event) => {
            event.preventDefault();
            const html = await renderSettingsTags(user.accessToken);
            place.innerHTML = html;

            const placeTags = getContainer('place-tags-settings');
            if (placeTags) {
                initTagsList(placeTags, {
                    onCreateTag: (name) => createTag(user.accessToken, { name })
                });
                initSettingsTagsDelete(user.accessToken)
            }
        })

     if (document.__settingsBound) return;
    document.__settingsBound = true;

    const token = getAuth()?.accessToken;
    const infoPlace = document.getElementById("information-place-settings");
    if (!infoPlace) return;

    const tabList = document.getElementById("tab-list");
    tabList?.addEventListener("click", async (e) => {
        const tab = e.target.closest(".tab");
        if (!tab) return;
        e.preventDefault();

        // подсветка активной вкладки
        tabList.querySelectorAll(".tab").forEach((b) =>
            b.classList.toggle("active", b === tab)
        );

        // отрисовка контента
        try {
            if (tab.id === "tab-tags") {
                infoPlace.innerHTML = await renderSettingsTags(token);
                initSettingsProfile();
            } else if (tab.id === "tab-profile") {
                infoPlace.innerHTML = await renderSettingsProfile(token);
                initSettingsProfile();
            }
        } catch (err) {
            console.error("[settings] tab render failed:", err);
            infoPlace.innerHTML = `<p class="error">Ошибка: ${err.message}</p>`;
        }
    });

    // по умолчанию — вкладка «Профиль»
    tabList?.querySelector("#tab-profile")?.click();

} 

    