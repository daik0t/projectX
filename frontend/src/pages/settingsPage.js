import { initSettingEvents } from "../services/init-events"


export async function renderSettingsPage(){

    const container = document.getElementById('app')
    
    container.innerHTML = `
    <div class="settings-page" id="settings-page">
        <div class="title-settings-window" id="header-settings-page">
            <div calss="title-text-settings">
                Настройки
            </div>
            <button class="btn-close" id="btn-close-settings" type="button">
                <img src="./src/assets/cross.svg">
            </button>
        </div>
        <div class="body-settings-page" id="body-settings-page">
            <div class="sidebar-settings" id="sidebar-settings">
                <div class="search-line-settings" id="search-line-settings">
                    <input type="text" class="search-settings" id="search-settings">
                </div>
                <div class="tab-list" id="tab-list">
                    <button class="tab" id="tab-tags">Управление тэгами</button>
                </div>
            </div>
            <div class="information-place-settings" id="information-place-settings">

            </div>
            <div class="more-information-place-settings" id="more-information-place-settings">
            
            </div>
        </div>
        <footer class="bottom-main-page">
            <button class="btn-home" id="btn-home">
                <img src="./src/assets/home.svg">
            </button>
            <button class="btn-explorer" id="btn-explorer">
                <img src="./src/assets/mainfolder.svg">
            </button>
            <button class="btn-setting" id="btn-setting">
                <img src="./src/assets/settings.svg">
            </button>
            <img src="./src/assets/trash.svg" id="trash" class="trash">
        </footer>
    </div>
    `

   await initSettingEvents()
}