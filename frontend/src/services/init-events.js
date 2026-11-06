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
} 

    