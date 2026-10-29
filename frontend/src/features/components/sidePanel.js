import { navigate } from "../../routers";
import { clearAuth } from "../service/auth-storage";

export function sidePanelRender() {
    return `
        <div id="sidebar" class="sidebar">
             <div class="sidebar-header">
                    <img class="sidebar-avatar" src="https://img.icons8.ru/?size=100&id=98957&format=png&color=000000">
                <hr class="sidebar-line">
            </div>
            
            <div class="sidebar-content">
                <a href="/settings"  class="sidebar-link">Управление аккаунтом</a>
                <!-- остальные пункты -->
            </div>

            <div class="sidebar-footer">
                <a id="sidebar-link logout" class="sidebar-link logout">Выйти</a>
            </div>
        </div>

        <div id="sidebar-overlay" class="sidebar-overlay"></div>
    `
}

export function initSidePanel(openButton, sideBar, overLay, btnExit) {
    const sidebar = document.getElementById(sideBar);
    const overlay = document.getElementById(overLay);
    const openBtn = document.getElementById(openButton);
    const exitBtn = document.getElementById(btnExit)

    if (openBtn){
        openBtn.addEventListener('click', openSidebar);
    }

    if (!openBtn || !sidebar || !overlay || !exitBtn) {
        return;
    }

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }

    overlay.addEventListener('click', closeSidebar);

    exitBtn.addEventListener('click', clearAuth)
}
