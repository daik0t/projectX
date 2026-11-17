import { getTags } from "../api/video"
import { actionWindowRender} from "../components/actionWindow"
import { getAuth } from "../services/auth-storage"
import { initMainEvents} from "../services/init-events"
import { renderAddWindow } from "../components/addWindow"
import { renderDropdownFilter } from "../components/dropdownFilter"
import { renderHomeBoard } from "../components/homeBoard"
import { initTagsList } from "../services/add-tags"
import { createTag } from "../api/video"
import { me } from "../api/auth"
import { escapeHtml } from "../lib/html"

export async function renderMain() {

    const auth = getAuth()
    const token = auth?.accessToken

    const [userH, tags] = await Promise.all([me(), getTags(token)])

    const container = document.getElementById('app')
    const displayName = escapeHtml(userH?.displayName ?? 'Гость')

    container.innerHTML = `
    ${actionWindowRender()}
    ${await renderAddWindow(token, tags)}
    ${await renderDropdownFilter(token, tags)}
    ${await renderHomeBoard()}
    <div class="main-page">
        <header class="top-main-page">
            <button class="btn-add" id="btn-add">
                <img src="/assets/plus.svg" alt="">
                Добавить
            </button>
            <input class="raw-path" id="raw-path" readonly>
            <input class="search-input" id="search-input" type="text" placeholder="Поиск">
            <button class="btn-filter" id="btn-filter">
                <img src="/assets/filter.svg" width="10px" height="10px" alt="">
            </button>
        </header>
        <div class="center-main-page">
            <aside class="sidebar-tags" id="sidebar-tags">
                <div class="user-name" id="user-name">
                    >${displayName}
                </div>
                <div class="title">>видео</div>
                <div class="tags-list" id="tags-list">
                    <button class="video-tag">>все</button>
                    <br>${tags.map(t => `<button class="video-tag" data-tag-id="${escapeHtml(t.id)}" >>${escapeHtml(t.name)}</button>`).join(`<br>`)}
                </div>
            </aside>
            <div class="video-grid" id="video-grid">
            </div>
        </div>

        <footer class="bottom-main-page">
            <button class="btn-home" id="btn-home">
                <img src="/assets/home.svg" alt="">
            </button>
            <button class="btn-explorer" id="btn-explorer">
                <img src="/assets/mainfolder.svg" alt="">
            </button>
            <button class="btn-setting" id="btn-setting">
                <img src="/assets/settings.svg" alt="">
            </button>
            <img src="/assets/trash.svg" id="trash" class="trash" alt="">
        </footer>
    </div>
    `
    initTagsList('add-window-form', {
        onCreateTag: (name) => createTag(token, { name }),
    });

    initTagsList("place-tags-filter", {
        onCreateTag: (name) => createTag(token, { name }),
    });

    await initMainEvents(auth)

}
