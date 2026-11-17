import { renderVideoList } from "./render-video-list";

const state = {
    container: null,
    token: null,
    selectedTags: new Set(), // выбранные в UI, ещё не применённые
    appliedTags: new Set(),  // применённые к текущему списку
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
    return Array.from(state.appliedTags);
}

/** Зафиксировать текущий выбор как применённый фильтр (без рендера). */
export function commitFilter() {
    state.appliedTags = new Set(state.selectedTags);
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
    state.container = null;
    state.token = null;
}

export async function applyFilter() {
    if (!state.container || !state.token) return;

    const ids = getSelectedTagIds();
    commitFilter();

    await renderVideoList(state.container, state.token, ids);
    window.dispatchEvent(new CustomEvent('filter:applied'));
}

export function syncUI(root = document) {
    root.querySelectorAll('input.toggle-checkbox[name="tags"]').forEach((cb) => {
        cb.checked = state.selectedTags.has(String(cb.value));
    });

    root.querySelectorAll('.video-tag[data-tag-id]').forEach((btn) => {
        const active = state.selectedTags.has(String(btn.dataset.tagId));
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
    });

    const allButton = root.querySelector('#btn-all-tags');
    if (allButton) {
        const active = state.selectedTags.size === 0;
        allButton.classList.toggle('active', active);
        allButton.setAttribute('aria-pressed', String(active));
    }
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