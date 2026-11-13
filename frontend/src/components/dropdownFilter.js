import { tagsListRender } from "./tagsList"
import { setTag, applyFilter, clearFilter, syncUI } from "../services/filter";

export async function renderDropdownFilter(token) {
    return `
    <div class="place-tags-filter-overlay" id="place-tags-filter-overlay"></div>
    <form class="place-tags-filter" id="place-tags-filter">
        ${await tagsListRender(token, {}, 1)}
        <div class="place-tags-filter-actions">
            <button type="button" class="tag-apply-btn" id="tag-apply-btn">Применить</button>
            <button type="button" class="tag-reset-btn" id="tag-reset-btn">Сбросить</button>
        </div>
    </form>
    `
}

/** Вызывать после вставки dropdown в DOM */
export function bindDropdownFilter() {
    const form = document.getElementById("place-tags-filter");
    if (!form) return;

    // 1) Чекбоксы -> состояние фильтра
    form.addEventListener("change", (e) => {
        const cb = e.target.closest('input.toggle-checkbox[name="tags"]');
        if (!cb) return;
        setTag(cb.value, cb.checked);
    });

    // 2) Применить
    form.querySelector("#tag-apply-btn")?.addEventListener("click", async (e) => {
        e.preventDefault();
        await applyFilter();
    });

    // 3) Сбросить
    form.querySelector("#tag-reset-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        clearFilter();
    });

    // Закрытие по клику на оверлей (по желанию)
    document.getElementById("place-tags-filter-overlay")?.addEventListener("click", () => {
        form.closest(".place-tags-filter-wrapper")?.classList.remove("open");
        // или form.style.display = "none" — как у тебя устроено
    });

    // Если dropdown рендерится после initFilter — синхронизируем чекбоксы
    syncUI(form);
}