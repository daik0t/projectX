import { getTags } from "../api/video"
import { actionWindowRender} from "../components/actionWindow"
import { getAuth } from "../services/auth-storage"
import { initMainEvents} from "../services/init-events"
import { renderAddWindow } from "../components/addWindow"
import { renderDropdownFilter } from "../components/dropdownFilter"
import { renderHomeBoard } from "../components/homeBoard"
import { initTagsList } from "../services/add-tags"
import { createTag } from "../api/video"


export async function renderMain() {

    const user = await getAuth()

    const tags = await getTags(user.accessToken)

    const container = document.getElementById('app')
    
    container.innerHTML = `
    ${actionWindowRender()}
    ${await renderAddWindow(user.accessToken)}
    ${await renderDropdownFilter(user.accessToken)}
    ${await renderHomeBoard()}
    <div class="main-page">
        <header class="top-main-page">
            <button class="btn-add" id="btn-add">
                <img src="./src/assets/plus.svg">
                Добавить
            </button>
            <input class="raw-path" id="raw-path" readonly>
            <input class="search-input" id="search-input" type="text" placeholder="Поиск">
            <button class="btn-filter" id="btn-filter">
                <img src="./src/assets/filter.svg" width="10px" height="10px">
            </button>
        </header>
        <div class="center-main-page">
            <aside class="sidebar-tags" id="sidebar-tags">
                <div class="user-name" id="user-name">
                    >${user.user ? user.user.displayName : "Пользователь"} 
                </div>
                <div class="title">>видео</div>
                <div class="tags-list" id="tags-list">
                    <button class="video-tag">>все</button>
                    <br>${tags.map(t => `<button class="video-tag">>${t.name}</button>`).join(`<br>`)}
                </div>
            </aside>
            <div class="video-grid" id="video-grid">
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
    initTagsList('add-window-form', {
        onCreateTag: (name) => createTag(user.accessToken, { name }),
    });
    
    initTagsList("place-tags-filter", {
        onCreateTag: (name) => createTag(user.accessToken, { name }),
    });
    initMainEvents(user, container)

}


