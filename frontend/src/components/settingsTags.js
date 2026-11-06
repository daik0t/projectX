import { tagsListRender } from "./tagsList";

export async function renderSettingsTags(token) {
    
    const tagsHtml = await tagsListRender(token, {}, 1);


    return `
    <div class="settings-tags" id="settings-tags"> 
        <div class="place-tags-settings" id="place-tags-settings">
            ${tagsHtml}
        </div>
        <button class="delete-tags" id="delete-tags">Удалить</button>
    </div>
    `
}