import { renderVideoList } from "./render-video-list";

const state = {
    container: null,
    token: null,
    selectedTags: new Set(), // Set<string> — храним id как строки
};

/** Инициализация — вызывать один раз при монтировании страницы */
export function initFilter({ container, token }) {
    console.log("[filter] initFilter", { container, token: !!token });
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

/** Добавить/убрать тег. Возвращает новое состояние */
export function toggleTag(id) {
    const key = String(id);
    if (state.selectedTags.has(key)) state.selectedTags.delete(key);
    else state.selectedTags.add(key);
    syncUI();
    return state.selectedTags.has(key);
}

/** Установить чекбокс напрямую (используется в dropdown) */
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

/** Применить фильтр — перерисовать список видео */
export async function applyFilter() {
    if (!state.container || !state.token) {
        console.warn("[filter] applyFilter: нет container или token. initFilter вызван?", {
            container: state.container, token: !!state.token,
        });
        return;
    }
    const ids = getSelectedTagIds();
    console.log("[filter] applyFilter → renderVideoList, tagIds:", ids);
    await renderVideoList(state.container, state.token, ids);
}

/** Синхронизировать UI (чекбоксы в dropdown + кнопки в SidePanel) */
export function syncUI(root = document) {
    // Чекбоксы в dropdown
    root.querySelectorAll('input.toggle-checkbox[name="tags"]').forEach((cb) => {
        cb.checked = state.selectedTags.has(String(cb.value));
    });
    // Кнопки в SidePanel
    root.querySelectorAll('.video-tag[data-tag-id]').forEach((btn) => {
        btn.classList.toggle('active', state.selectedTags.has(String(btn.dataset.tagId)));
    });
}

/** Повесить обработчики на кнопки SidePanel */
export function bindSidePanelTags(root = document) {
    root.querySelectorAll('.video-tag[data-tag-id]').forEach((btn) => {
        if (btn.dataset.boundFilter) return; // защита от двойной привязки
        btn.dataset.boundFilter = "1";
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            toggleTag(btn.dataset.tagId);
            await applyFilter();
        });
    });
}