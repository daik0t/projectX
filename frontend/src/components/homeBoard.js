export async function renderHomeBoard() {
    return `
    <div class="home-board-overlay" id="home-board-overlay" aria-hidden="true"></div>
    <div class="home-board" id="home-board" role="menu" aria-label="Меню" aria-hidden="true">
        <button class="btn-exit" id="btn-exit" type="button" role="menuitem">Выход</button>
    </div>
    `
}
