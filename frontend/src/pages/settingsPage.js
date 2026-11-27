import { renderHomeBoard } from "../components/homeBoard"
import { initSettingEvents } from "../services/settings-events"

export async function renderSettingsPage({ root = document.getElementById('app') } = {}) {

    const container = root
    if (!container) return

    container.innerHTML = `
        ${renderHomeBoard()}
        <div class="settings-page" id="settings-page">
            <div class="title-settings-window" id="header-settings-page">
                <div class="title-text-settings">Настройки</div>
                <button class="btn-close" id="btn-close-settings" type="button" aria-label="Закрыть настройки">
                    <img src="/assets/cross.svg" alt="">
                </button>
            </div>
            <div class="body-settings-page" id="body-settings-page">
                <div class="sidebar-settings" id="sidebar-settings">
                    <div class="tab-list" id="tab-list" role="tablist" aria-label="Разделы настроек">
                        <button class="tab" id="tab-profile" type="button" role="tab"
                            aria-selected="true" aria-controls="information-place-settings">Профиль</button>
                        <button class="tab" id="tab-tags" type="button" role="tab"
                            aria-selected="false" aria-controls="information-place-settings">Управление тэгами</button>
                    </div>
                </div>
                <div class="information-place-settings" id="information-place-settings"
                    role="tabpanel" aria-live="polite">
                    <div class="page-loading" role="status">Загрузка…</div>
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
                <button class="btn-setting" id="btn-setting" type="button" aria-label="Настройки"
                    aria-current="page" disabled>
                    <img src="/assets/settings.svg" alt="">
                </button>
            </footer>
        </div>
    `

    await initSettingEvents(container)
}
