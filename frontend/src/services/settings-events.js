import { getContainer } from "./dom";
import { initBoard } from "./init-windows";
import { openPage } from "./open-page";
import { logout } from "./auth-actions";
import { renderSettingsTags } from "../components/settingsTags";
import { renderSettingsProfile, initSettingsProfile } from "../components/settingsProfile";
import { initSettingsTagsDelete, initTagsList } from "./add-tags";
import { createTag } from "../api/video";
import { escapeHtml } from "../lib/html";
import { pageSignal } from "../lib/page-lifecycle";

export async function initSettingEvents() {
    const signal = pageSignal();

    openPage("btn-close-settings", "/");
    openPage("btn-explorer", "/");

    if (signal.aborted) return;

    initBoard("btn-home", "home-board", "home-board-overlay");

    getContainer("btn-exit")?.addEventListener("click", logout);

    const tabList = document.getElementById("tab-list");
    tabList?.addEventListener("click", onSettingsTabClick, { signal });
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

    await openDefaultSettingsTab();
}

async function activateSettingsTab(tab) {
    const infoPlace = document.getElementById("information-place-settings");
    if (!infoPlace) return;

    document.querySelectorAll("#tab-list .tab").forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
    });

    try {
        if (tab.id === "tab-tags") {
            const html = await renderSettingsTags();
            if (!infoPlace.isConnected) return;
            infoPlace.innerHTML = html;

            const placeTags = document.getElementById("place-tags-settings");
            if (placeTags) {
                initTagsList(placeTags, {
                    onCreateTag: (name) => createTag({ name }),
                });
                initSettingsTagsDelete();
            }
        } else if (tab.id === "tab-profile") {
            const data = await renderSettingsProfile();
            if (!infoPlace.isConnected) return;
            infoPlace.innerHTML = data.html;
            initSettingsProfile(data.profile);
        }
    } catch (err) {
        if (!infoPlace.isConnected) return;
        console.error("[settings] tab render failed:", err);
        infoPlace.innerHTML = `<p class="error">Ошибка: ${escapeHtml(err.message)}</p>`;
    }
}

async function onSettingsTabClick(e) {
    const tab = e.target.closest("#tab-list .tab");
    if (!tab) return;

    e.preventDefault();
    await activateSettingsTab(tab);
}

async function openDefaultSettingsTab() {
    const tabList = document.getElementById("tab-list");
    if (!tabList) return;

    const profileTab = tabList.querySelector("#tab-profile");
    if (profileTab) await activateSettingsTab(profileTab);
}
