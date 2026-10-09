export function sidePanelRender() {
    return `
        <div id="sidebar" class="sidebar">
             <div class="sidebar-header">
                    <img class="sidebar-avatar" src="https://img.icons8.ru/?size=100&id=98957&format=png&color=000000">
                <hr class="sidebar-line">
            </div>
            
            <div class="sidebar-content">
                <a href="#" class="sidebar-link">Управление аккаунтом</a>
                <!-- остальные пункты -->
            </div>

            <div class="sidebar-footer">
                <a href="#" class="sidebar-link logout">Выйти</a>
            </div>
        </div>


        <div id="sidebar-overlay" class="sidebar-overlay"></div>
    `
}

export function initSidePanel(openButton, sideBar, overLay) {
    const sidebar = document.getElementById(sideBar);
    const overlay = document.getElementById(overLay);
    const openBtn = document.getElementById(openButton);

    if (!openBtn || !sidebar || !overlay) {
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

    openBtn.addEventListener('click', openSidebar);

    overlay.addEventListener('click', closeSidebar);
}
