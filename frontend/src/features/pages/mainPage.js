import { initDropdown, dropdownRender} from "../components/dropdown"
import { sidePanelRender, initSidePanel } from "../components/sidePanel"
import { addVideoRender } from "../components/addVideoWindow"
import { videoCardRender } from "../components/videoCard"
import { editVideoRender} from "../components/editVideoWindow"
import { initModal } from "../utils/modal"
import { initList } from "../components/dropdown"

export async function renderMain(){

    const container = document.getElementById('app')
    
    container.innerHTML = `
            ${sidePanelRender()}
            ${addVideoRender()}
            ${editVideoRender()}
            <header class = "site-header">
                <button class = "btn-add-video" id = "btn-add-video">
                    <span class="btn-add-video-icon">+</span>
                    <span class="btn-add-video-text">Добавить</span>
                </button>
                <form class="search-form" action="/search">
                    <input type="text" 
                    name="search-line" 
                    id="search-line"
                    placeholder="поиск"
                    >
                    ${dropdownRender()}
                </form>
                <button class = "btn-side-panel custom-button" id="btn-side-panel">
                    <img src="https://img.icons8.ru/?size=100&id=98957&format=png&color=000000" alt="Настройки">
                </button>
            </header>
            <hr class = "header-line">
            
            <nav class="tabs-bar">
                <div class="tab active">Все</div>
                <div class="tab">Тэг 1</div>
            </nav>
            <hr class = "category-line">

            <div class = "video-list">
                ${videoCardRender()}
            </div>
    `

    initEvents();
}

function initEvents(){

    const addVideoTagsDropdown = initDropdown('tags-select');
    const editVideoTagsDropdown = initDropdown('edit-tags-select');

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    initModal({ 
        openBtnId: 'btn-add-video', 
        overlayId: 'add-video-overlay', 
        windowId: 'add-video-window', 
        onClose: () => addVideoTagsDropdown?.reset(),
    });

    initModal({ 
        openBtnId: 'edit', 
        overlayId: 'edit-video-overlay', 
        windowId: 'edit-video-window',
        onClose: () => editVideoTagsDropdown?.reset(),
    });

    initSidePanel('btn-side-panel', 'sidebar', 'sidebar-overlay', 'sidebar-link logout')
    initDropdown('search-line')
    initList('place-tags')
    initList('edit-place-tags')
}

