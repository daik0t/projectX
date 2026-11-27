import { initBoard } from "./init-windows";
import { openPage } from "./open-page";
import { logout } from "./auth-actions";
import { renderSettingsTags } from "../components/settingsTags";
import { renderSettingsProfile, initSettingsProfile } from "../components/settingsProfile";
import { initSettingsTagsDelete, initTagsList } from "./add-tags";
import { createTag } from "../api/video";
import { escapeHtml } from "../lib/html";
import { pageSignal } from "../lib/page-lifecycle";

export async function initSettingEvents(root = document) {
    const signal = pageSignal();

    openPage("btn-close-settings", "/", root);
    openPage("btn-explorer", "/", root);

    if (signal.aborted) return;

    initBoard("btn-home", "home-board", "home-board-overlay", root);

    root.querySelector("#btn-exit")?.addEventListener("click", logout);

    const tabList = root.querySelector("#tab-list");
    tabList?.addEventListener("click", (event) => onSettingsTabClick(event, root), { signal });
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

    await openDefaultSettingsTab(root);
}

async function activateSettingsTab(tab, root = document) {
    const infoPlace = root.querySelector("#information-place-settings");
    if (!infoPlace) return;

    root.querySelectorAll("#tab-list .tab").forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
    });

    try {
        if (tab.id === "tab-tags") {
            const html = await renderSettingsTags();
            if (!infoPlace.isConnected) return;
            infoPlace.innerHTML = html;

            const placeTags = root.querySelector("#place-tags-settings");
            if (placeTags) {
                initTagsList(placeTags, {
                    onCreateTag: (name) => createTag({ name }),
                });
                initSettingsTagsDelete(root);
            }
        } else if (tab.id === "tab-profile") {
            const data = await renderSettingsProfile();
            if (!infoPlace.isConnected) return;
            infoPlace.innerHTML = data.html;
            initSettingsProfile(data.profile, root);
        }
    } catch (err) {
        if (!infoPlace.isConnected) return;
        console.error("[settings] tab render failed:", err);
        infoPlace.innerHTML = `<p class="error">Ошибка: ${escapeHtml(err.message)}</p>`;
    }
}

async function onSettingsTabClick(event, root) {
    const tab = event.target.closest("#tab-list .tab");
    if (!tab) return;

    event.preventDefault();
    await activateSettingsTab(tab, root);
}

async function openDefaultSettingsTab(root) {
    const tabList = root.querySelector("#tab-list");
    if (!tabList) return;

    const profileTab = tabList.querySelector("#tab-profile");
    if (profileTab) await activateSettingsTab(profileTab, root);
}
