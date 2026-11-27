import { tagsListRender } from "./tagsList"
import { setTag, applyFilter, clearFilter, syncUI } from "../services/filter";

export async function renderDropdownFilter(tags = null) {
    return `
    <div class="place-tags-filter-overlay" id="place-tags-filter-overlay" aria-hidden="true"></div>
    <form class="place-tags-filter" id="place-tags-filter" role="group"
        aria-label="Фильтр по тегам" aria-hidden="true">
        ${await tagsListRender({}, 1, tags)}
        <div class="place-tags-filter-actions">
            <button type="button" class="tag-apply-btn" id="tag-apply-btn">Применить</button>
            <button type="button" class="tag-reset-btn" id="tag-reset-btn">Сбросить</button>
        </div>
    </form>
    `
}


export function bindDropdownFilter(root = document) {
    const form = root.querySelector("#place-tags-filter");
    if (!form) return;

    form.addEventListener("change", (e) => {
        const cb = e.target.closest('input.toggle-checkbox[name="tags"]');
        if (!cb) return;
        setTag(cb.value, cb.checked);
    });

    form.querySelector("#tag-apply-btn")?.addEventListener("click", async (e) => {
        e.preventDefault();
        await applyFilter();
    });

    form.querySelector("#tag-reset-btn")?.addEventListener("click", async (e) => {
        e.preventDefault();
        clearFilter();
        await applyFilter();
    });

    syncUI(form);
}
