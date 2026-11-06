import { getContainer } from "./dom";
import { renderEditWindow } from "../components/editWindow";
import { setupDeleteVideo } from "./delete-video";
import { renderVideoList } from "./render-video-list";
import { editVideo } from "./edit-action";
import { renderPropertiesWindow } from "../components/propertiesWindow";
import {init} from "shareon"
import { getMetadata } from "./video-storage";
import { initTagsList } from "./add-tags";
import { createTag } from "../api/video";

export async function initBtnWindow(btnOpenId, windowId, overlayId, btnCloseId) {

    const openIds = Array.isArray(btnOpenId) ? btnOpenId : [btnOpenId];
    const closeIds = Array.isArray(btnCloseId) ? btnCloseId : [btnCloseId];

    const area = getContainer('app')
    const btn = openIds.map(i => getContainer(i));
    const windowEl = getContainer(windowId)
    const overlay = getContainer(overlayId)
    const btnClose = closeIds.map(i => getContainer(i));

    if(!windowEl || !btn) return;

    area.addEventListener('click', (event) => { 

        const clickedButton = event.target.closest('button');
        const isOpenAction = btn.includes(event.target) || btn.includes(clickedButton);

        if (!isOpenAction) return;

        event.preventDefault();
        windowEl.classList.add('show')
        overlay.classList.add('show')
    });
    
    windowEl.addEventListener('click', (event) => {
    
        const clickedButton = event.target.closest('button');
        const isCloseAction = btnClose.includes(event.target) || btnClose.includes(clickedButton);
        
        if (!isCloseAction) return;

        event.preventDefault();
        windowEl.classList.remove('show')
        overlay.classList.remove('show')
    })

}

function openCloseWindow(windowId, overlayId, btnCloseId) {
    const closeIds = btnCloseId == null ? [] : (Array.isArray(btnCloseId) ? btnCloseId : [btnCloseId]);

    const windowEl = getContainer(windowId)
    const overlay = getContainer(overlayId)
    const btnClose = closeIds.map(i => getContainer(i)).filter(Boolean);

    windowEl.classList.add('show')
    overlay.classList.add('show')

    windowEl.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        const isCloseAction = btnClose.length > 0 &&
            (btnClose.includes(event.target) || btnClose.includes(clickedButton));

        if (!isCloseAction) return;

        event.preventDefault();
        windowEl.classList.remove('show')
        overlay.classList.remove('show')
    })

    if (overlay) {
        overlay.addEventListener('click', (event) => {
            event.preventDefault();
            windowEl.classList.remove('show')
            overlay.classList.remove('show')
        })
    }
}

function removeWindow(id) {
    document.getElementById(id)?.remove();
}


export async function initActiveWindow(user) {

    const area = getContainer('app');
    const actionWindow = getContainer('action-window');
    const actionWindowOverlay = getContainer('action-window-overlay');

    let currentVideoId = null;

    area.addEventListener('dblclick', (event) => {
        const card = event.target.closest('.video-card');
        if (!card) return;

        event.preventDefault();

        const videoId = card.dataset.videoId;
        if (!videoId) return;

        currentVideoId = videoId;
        const data = getMetadata(currentVideoId)

        const share = getContainer('shareon')
        share.dataset.url = data.url
        share.dataset.title = data.title
        init()
        actionWindow.style.left = `${event.clientX + 5}px`;
        actionWindow.style.top  = `${event.clientY + 5}px`;

        actionWindow.classList.add('show');
        actionWindowOverlay.classList.add('show');
    });

    window.addEventListener('click', (event) => {
        actionWindow.classList.remove('show');
        actionWindowOverlay.classList.remove('show');
    });

    getContainer('btn-edit').addEventListener('click', async () => {
        if (!currentVideoId) return;

        removeWindow('edit-window');
        removeWindow('edit-window-overlay');

        const html = await renderEditWindow(user.accessToken, currentVideoId);
        area.insertAdjacentHTML('beforeend', html);

        initTagsList('edit-window-form', {
            onCreateTag: (name) => createTag(user.accessToken, { name }),
        });

        openCloseWindow("edit-window", "edit-window-overlay", ["btn-cancel-edit", "btn-close-edit"])
        await editVideo(user.accessToken, currentVideoId)
    });

    getContainer('btn-properties').addEventListener('click', async () => {
        if (!currentVideoId) return;

        removeWindow('properties-window');
        removeWindow('properties-window-overlay');

        const html = await renderPropertiesWindow(currentVideoId);
        area.insertAdjacentHTML('beforeend', html);

        openCloseWindow('properties-window', 'properties-window-overlay', 'btn-close-properties');
        currentVideoId = null;
    });

    getContainer('btn-share').addEventListener('click', async () => {
        if (!currentVideoId) return;
        
        area.insertAdjacentHTML('beforeend', html);


        currentVideoId = null;
    });

    getContainer('btn-del').addEventListener('click', () => {
        const videoList = getContainer('video-grid');
        if (!currentVideoId) return;
        setupDeleteVideo({token: user.accessToken, id: currentVideoId, onSuccess: async () => {
                if (videoList) await renderVideoList(videoList, user.accessToken);}
            })
        currentVideoId = null;
    });
}

export async function initWindow(btnOpenId, windowId, overlayId) {
    const openIds = Array.isArray(btnOpenId) ? btnOpenId : [btnOpenId];

    const area = getContainer('app')
    const btn = openIds.map(i => getContainer(i));
    const windowEl = getContainer(windowId)
    const overlay = getContainer(overlayId)

    if(!windowEl || !btn) return;

    area.addEventListener('click', (event) => { 

        const clickedButton = event.target.closest('button');
        const isOpenAction = btn.includes(event.target) || btn.includes(clickedButton);

        if (!isOpenAction) return;

        event.preventDefault();
        windowEl.classList.add('show')
        overlay.classList.add('show')
    });
    
    overlay.addEventListener('click', (event) => {
        event.preventDefault();
        windowEl.classList.remove('show')
        overlay.classList.remove('show')
    })
}

export async function initDropdown(btnId, windowId, overlayId) {

    const btn = getContainer(btnId)
    const dropdown = getContainer(windowId)
    const overlay = getContainer(overlayId)

    if(!dropdown) return;

    btn.addEventListener('click', (event) => { 
        event.preventDefault();

        const rect = btn.getBoundingClientRect();

        const windowWidth = dropdown.offsetWidth; 
        const targetLeft = rect.right - windowWidth;
        dropdown.style.top = `${rect.bottom  + 5}px`;
        dropdown.style.left = `${targetLeft }px`;

        dropdown.classList.add('show')
        overlay.classList.add('show')
    });

    overlay.addEventListener('click', (event) => {

        dropdown.classList.remove('show')
        overlay.classList.remove('show')
        
    })
}

export async function initBoard(btnId, windowId, overlayId) {
    const btn = getContainer(btnId)
    const dropdown = getContainer(windowId)
    const overlay = getContainer(overlayId)

    if(!dropdown) return;

    btn.addEventListener('click', (event) => { 
        event.preventDefault();

        const rect = btn.getBoundingClientRect();

        const windowheight = dropdown.offsetHeight; 

        dropdown.style.top = `${rect.top  - windowheight}px`;


        dropdown.classList.add('show')
        overlay.classList.add('show')
    });

    overlay.addEventListener('click', (event) => {

        dropdown.classList.remove('show')
        overlay.classList.remove('show')
        
    })
}



