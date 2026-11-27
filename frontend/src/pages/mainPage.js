import { getTags } from "../api/video"
import { actionWindowRender } from "../components/actionWindow"
import { getAuth } from "../services/auth-storage"
import { initMainEvents } from "../services/init-events"
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
    const container = document.getElementById('app')

    const [userH, tags] = await Promise.all([me(), getTags(token)])

    // Пока шли запросы, пользователь мог уйти на другую страницу.
    if (!container || !container.isConnected) return

    const displayName = escapeHtml(userH?.displayName ?? 'Гость')

    container.innerHTML = `
        ${actionWindowRender()}
        ${await renderAddWindow(token, tags)}
        ${await renderDropdownFilter(token, tags)}
        ${await renderHomeBoard()}
        <div class="main-page">
            <header class="top-main-page">
                <button class="btn-add" id="btn-add" type="button" aria-label="Добавить видео" aria-haspopup="dialog">
                    <img src="/assets/plus.svg" alt="">
                    Добавить
                </button>
                <input class="raw-path" id="raw-path" type="text" readonly
                    aria-label="Текущий путь" title="">
                <input class="search-input" id="search-input" type="search" placeholder="Поиск"
                    aria-label="Поиск видео" autocomplete="off">
                <button class="btn-filter" id="btn-filter" type="button"
                    aria-label="Фильтр по тегам" aria-expanded="false" aria-controls="place-tags-filter">
                    <img src="/assets/filter.svg" width="12" height="12" alt="">
                </button>
            </header>
            <div class="center-main-page">
                <aside class="sidebar-tags" id="sidebar-tags" aria-label="Теги">
                    <div class="user-name" id="user-name">
                        >${displayName}
                    </div>
                    <div class="title">>видео</div>
                    <div class="tags-list" id="tags-list">
                        <button class="video-tag" id="btn-all-tags" type="button" aria-pressed="true">>все</button>
                    </div>
                </aside>
                <div class="video-grid" id="video-grid" aria-live="polite" aria-busy="false">
                </div>
            </div>

            <footer class="bottom-main-page">
                <button class="btn-home" id="btn-home" type="button" aria-label="Меню"
                    aria-expanded="false" aria-controls="home-board">
                    <img src="/assets/home.svg" alt="">
                </button>
                <button class="btn-explorer" id="btn-explorer" type="button" aria-label="На главную">
                    <img src="/assets/mainfolder.svg" alt="">
                </button>
                <button class="btn-setting" id="btn-setting" type="button" aria-label="Настройки">
                    <img src="/assets/settings.svg" alt="">
                </button>
                <button class="trash" id="trash" type="button"
                    aria-label="Удалить видео: перетащите карточку в корзину"
                    title="Перетащите карточку сюда, чтобы удалить видео">
                    <img src="/assets/trash.svg" alt="">
                </button>
            </footer>
        </div>
    `

    if (!container.isConnected) return

    initTagsList('add-window-form', {
        onCreateTag: (name) => createTag(token, { name }),
    });

    initTagsList("place-tags-filter", {
        onCreateTag: (name) => createTag(token, { name }),
    });

    await initMainEvents(auth, userH, tags)
}
