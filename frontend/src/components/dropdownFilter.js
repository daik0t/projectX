import { tagsListRender } from "./tagsList"

export async function renderDropdownFilter(token) {
    return `
    <div class="place-tags-filter-overlay" id="place-tags-filter-overlay"></div>
    <form class="place-tags-filter" id="place-tags-filter">
        ${await tagsListRender(token, {}, 1)}
    </form>
    `
}