export function videoCardRender() {
    const title = 'Название видео'
    const tags = ['Тег 1', 'Тег 2', 'Тег 3']
    const thumbnail = '' 

    return `
        <div class="video-card">
            <div class="video-thumb">
                ${thumbnail
                    ? `<img src="${thumbnail}" alt="${title}">`
                    : ''}
            </div>

            <h3 class="video-title">${title}</h3>

            <div class="video-tags">
                ${tags.map(t => `<span class="video-tag">${t}</span>`).join(', ')}
            </div>

            <div class="video-actions">
                <button class="video-btn" id = "repost" data-action="share">Поделиться</button>
                <button class="video-btn" id = "edit" data-action="edit">Редактировать</button>
                <button class="video-btn" id = "delete" data-action="delete">Удалить</button>
            </div>
        </div>
    `;
}