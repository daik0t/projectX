import { renderVideoList } from "./render-video-list";

const state = {
    container: null,
    token: null,
    selectedTags: new Set(),
};

export function initFilter({ container, token }) {
    state.container = container;
    state.token = token;
    syncUI();
}

export function getSelectedTagIds() {
    return Array.from(state.selectedTags);
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
    state.container = null;
    state.token = null;
}

export async function applyFilter() {
    if (!state.container || !state.token) return;

    const ids = getSelectedTagIds();
    await renderVideoList(state.container, state.token, ids);
}

export function syncUI(root = document) {
    root.querySelectorAll('input.toggle-checkbox[name="tags"]').forEach((cb) => {
        cb.checked = state.selectedTags.has(String(cb.value));
    });
    root.querySelectorAll('.video-tag[data-tag-id]').forEach((btn) => {
        btn.classList.toggle('active', state.selectedTags.has(String(btn.dataset.tagId)));
    });
}

export function bindSidePanelTags(root = document) {
    root.querySelectorAll('.video-tag[data-tag-id]').forEach((btn) => {
        if (btn.dataset.boundFilter) return;
        btn.dataset.boundFilter = "1";
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            toggleTag(btn.dataset.tagId);
            await applyFilter();
        });
    });
}