import { tagsListRender } from "./tagsList";

export async function renderSettingsTags() {
    
    const tagsHtml = await tagsListRender({}, 1);


    return `
    <div class="settings-tags" id="settings-tags"> 
        <div class="place-tags-settings" id="place-tags-settings">
            ${tagsHtml}
        </div>
        <button class="delete-tags" id="delete-tags" type="button">Удалить</button>
    </div>
    `
}