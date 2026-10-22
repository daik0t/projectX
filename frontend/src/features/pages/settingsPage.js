export async function  renderSettings() {
    const container = document.getElementById('app')
    
    container.innerHTML = `
    <header class="header">
        <div class="user-icon">
            <svg viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
        </div>
    </header>

    <main class="main-wrapper">
        <div class="content-container">
            
            <aside class="sidebar">
                <div class="sidebar-top-space"></div>
                <button>Кнопка</button>
            </aside>

            <section class="content-area">
                <!-- Информация -->
            </section>

        </div>
    </main>
    `
}