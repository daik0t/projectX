import { renderVideoList } from "./render-video-list";

const state = {
    container: null,
    token: null,
    selectedTags: new Set(),
    appliedTags: new Set(),
    sidebarTagId: null,
    activeSource: "dropdown",
};

export function initFilter({ container, token }) {
    state.container = container;
    state.token = token;
    syncUI();
}

export function getSelectedTagIds() {
    return Array.from(state.selectedTags);
}

export function getAppliedTagIds() {
    if (state.activeSource === "sidebar") {
        return state.sidebarTagId ? [state.sidebarTagId] : [];
    }
    return Array.from(state.appliedTags);
}

export function getSidebarTagId() {
    return state.sidebarTagId;
}

export function commitFilter() {
    state.appliedTags = new Set(state.selectedTags);
    state.activeSource = "dropdown";
    state.sidebarTagId = null;
    syncUI();
}

export function isTagSelected(id) {
    return state.selectedTags.has(String(id));
}

export function toggleTag(id) {
    const key = String(id);
    if (state.selectedTags.has(key)) state.selectedTags.delete(key);
    else state.selectedTags.add(key);
    syncUI();
    return state.selectedTags.has(key);
}

export function setTag(id, checked) {
    const key = String(id);
    if (checked) state.selectedTags.add(key);
    else state.selectedTags.delete(key);
    syncUI();
}

export function clearFilter() {
    state.selectedTags.clear();
    syncUI();
}

export function resetFilter() {
    state.selectedTags.clear();
    state.appliedTags.clear();
    state.sidebarTagId = null;
    state.activeSource = "dropdown";
    state.container = null;
    state.token = null;
}

export async function applyFilter() {
    if (!state.container || !state.token) return;

    const ids = getSelectedTagIds();
    commitFilter();

    await renderVideoList(state.container, state.token, ids);
    window.dispatchEvent(new CustomEvent("filter:applied"));
}

export async function applySidebarTag(tagId) {
    if (!state.container || !state.token) return;

    state.sidebarTagId = tagId ? String(tagId) : null;
    state.activeSource = "sidebar";

    syncUI();

    await renderVideoList(state.container, state.token, getAppliedTagIds());
    window.dispatchEvent(new CustomEvent("filter:applied"));
}

export function syncUI(root = document) {
    root.querySelectorAll('input.toggle-checkbox[name="tags"]').forEach((cb) => {
        cb.checked = state.selectedTags.has(String(cb.value));
    });

    root.querySelectorAll(".video-tag[data-tag-id]").forEach((btn) => {
        const active = String(btn.dataset.tagId) === state.sidebarTagId;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
    });

    const allButton = root.querySelector("#btn-all-tags");
    if (allButton) {
        const active = !state.sidebarTagId;
        allButton.classList.toggle("active", active);
        allButton.setAttribute("aria-pressed", String(active));
    }
}

export function bindSidePanelTags(root = document) {
    root.querySelectorAll(".video-tag[data-tag-id]").forEach((btn) => {
        if (btn.dataset.boundFilter) return;
        btn.dataset.boundFilter = "1";
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const id = String(btn.dataset.tagId);
            const next = state.sidebarTagId === id ? null : id;
            await applySidebarTag(next);
        });
    });
}