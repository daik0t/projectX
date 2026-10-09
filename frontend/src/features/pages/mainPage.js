import { initSearchDropdown, dropdownRender} from "../component/dropdown"
import { sidePanelRender, initSidePanel } from "../component/sidePanel"
import { insertAddVideoWindow, addVideoRender } from "../component/addVideWindow"
import { videoCardRender } from "../component/videoCard"
import { editVideoRender, initEditVideoWindow } from "../component/editVideoRender"
import "../style/mainpage/header.css"
import "../style/mainpage/tagsline.css"

export async function renderMain(){

    const container = document.getElementById('app')
    
    container.innerHTML = `
            ${dropdownRender()}
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
                </form>
                <button class = "btn-side-panel custom-button" id="btn-side-panel">
                    <img src="https://img.icons8.ru/?size=100&id=98957&format=png&color=000000" alt="Настройки">
                </button>
            </header>
            <hr class = "header-line">
            
            <div class = "tags-line">
                <button class="category-btn active" data-category="all">Все</button> <!-- Функция по определению всех тэгов -->
                <button class="category-btn" data-category="tag2">Тег 2</button>
            </div>
            <hr class = "category-line">

            <div class = "video-list">
                ${videoCardRender()}
            </div>
    `
    insertAddVideoWindow ('add-video-overlay','btn-add-video','add-video-window')
    initSidePanel('btn-side-panel', 'sidebar', 'sidebar-overlay')
    initSearchDropdown('search-line', 'dropdown')
    initEditVideoWindow('edit', 'edit-video-overlay','edit-video-window', 'edit-video-form')
    initSearchDropdown('tags-select', 'dropdown-select')
}

