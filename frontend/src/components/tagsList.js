import { getTags } from "../api/video"

export async function tagsListRender(token, data = {}, type = 0) {

const tags = await getTags(token)

const selectedIds = new Set(
    (data?.tags ?? []).map(t =>
        String(typeof t === "object" && t !== null ? t.id : t)
    )
);

const tagsHtml = `${tags.map(t => `
    <label class="tag-item">
        <input type="checkbox" name="tags" value="${t.id}" class="toggle-checkbox" ${selectedIds.has(String(t.id)) ? "checked" : ""}>
        <span class="tag-button">${t.name}</span>
    </label>
`).join(' ')}`

if (type!= 0 ){
    return `
        <div class="tags-list-wrapper">
            <div class="tags-container" data-tags-container>${tagsHtml}</div>

            <button class="tag-add-btn" type="button">+ Добавить тэг</button>

            <div class="tag-input-group hidden">
                <input type="text" class="new-tag-input" placeholder="Новый тэг...">
                <button class="tag-save-btn" type="button">✓</button>
            </div>
        </div>
    `;
}
else{
    return tagsHtml
}
}
