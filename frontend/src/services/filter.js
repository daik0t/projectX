import { renderVideoList } from "./render-video-list";

const state = {
    container: null,
    selectedTags: new Set(),
    appliedTags: new Set(),
    sidebarTagId: null,
};

export function initFilter({ container }) {
    state.container = container;
    syncUI();
}

export function getSidebarTagId() {
    return state.sidebarTagId;
}

export function getFilterTagIds() {
    return Array.from(state.appliedTags);
}

export function getFilterState() {
    return {
        categoryTagId: state.sidebarTagId,
        filterTagIds: getFilterTagIds(),
    };
}

export function commitFilter() {
    state.appliedTags = new Set(state.selectedTags);
    state.sidebarTagId = null;
    syncUI();
}

export function clearSidebarTag() {
    if (!state.sidebarTagId) return;
    state.sidebarTagId = null;
    syncUI();
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
    state.container = null;
}

export async function applyFilter() {
    if (!state.container) return;

    commitFilter();

    const filter = getFilterState();
    await renderVideoList(state.container, filter);
    window.dispatchEvent(new CustomEvent("filter:applied"));
}

export async function applySidebarTag(tagId) {
    if (!state.container) return;

    state.sidebarTagId = tagId ? String(tagId) : null;
    syncUI();

    const filter = getFilterState();
    await renderVideoList(state.container, filter);
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
