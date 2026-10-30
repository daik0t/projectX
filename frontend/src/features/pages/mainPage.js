import { dropdownRender, initDropdown } from "../components/dropdown"
import { sidePanelRender, initSidePanel } from "../components/sidePanel"
import { setupAddVideo } from "../components/addVideoWindow"
import { editVideoRender, setupEditVideo } from "../components/editVideoWindow"
import { renderVideoList } from "../service/render-video-list"
import { getAuth } from "../service/auth-storage"
import { getTags, createTag, deleteVideo } from "../api/video"

export async function renderMain() {
    const user = getAuth();
    const token = user?.accessToken;

    let allTags = [];
    try {
        if (token) allTags = await getTags(token);
    } catch (e) {
        console.error("Не удалось загрузить теги", e);
    }

    const container = document.getElementById('app')
    
    container.innerHTML = `
            ${sidePanelRender()}
            ${editVideoRender(allTags)}
            <header class="site-header">
                <button class="btn-add-video" id="btn-add-video">
                    <span class="btn-add-video-icon">+</span>
                    <span class="btn-add-video-text">Добавить</span>
                </button>
                <form class="search-form" action="/search">
                    <input type="text" 
                    name="search-line" 
                    id="search-line"
                    placeholder="поиск"
                    >
                    ${dropdownRender({ tags: allTags })}
                </form>
                <button class="btn-side-panel custom-button" id="btn-side-panel">
                    <img src="https://img.icons8.ru/?size=100&id=98957&format=png&color=000000" alt="Настройки">
                </button>
            </header>
            <hr class="header-line">
            
            <nav class="tabs-bar">
                <div class="tab active">Все</div>
                <div class="tab">Тэг 1</div>
            </nav>
            <hr class="category-line">

            <div id="video-list" class="video-list"></div>
    `

    await initEvents(token);
}

async function initEvents(token) {
    const listContainer = document.getElementById('video-list');

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    await setupAddVideo({
        token: token,
        openBtnId: 'btn-add-video', 
        onSuccess: () => {
            if (listContainer) renderVideoList(listContainer, token);
        }
    });

    const editVideoApi = setupEditVideo({
        token: token,
        onSuccess: () => renderVideoList(listContainer, token),
        onDeleteSuccess: () => renderVideoList(listContainer, token) 
    });
    
    listContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('.video-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const videoId = Number(btn.dataset.id);
        const card = btn.closest('.video-card');

        if (action === 'delete') {
            if (confirm('Вы уверены, что хотите удалить видео?')) {
                try {
                    btn.disabled = true;
                    await deleteVideo(token, videoId);
                    card.remove();
                } catch (err) {
                    alert('Ошибка удаления: ' + err.message);
                    btn.disabled = false;
                }
            }
        }

        if (action === 'edit') {
            const video = {
                id: videoId,
                url: card.dataset.url,
                tagIds: card.dataset.tags ? card.dataset.tags.split(',').map(Number) : []
            };
            editVideoApi.open(video);
        }
    });

    initSidePanel('btn-side-panel', 'sidebar', 'sidebar-overlay', 'btn-logout');
    
    initDropdown('search-line', {
        onCreateTag: (name) => createTag(token, { name })
    });

    if (listContainer) {
        renderVideoList(listContainer, token);
    }
}