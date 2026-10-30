export function videoCardRender(video) {
    const { id, url, tags = [] } = video || {};

    const title = url || 'Без названия';
    const thumbnail = '';

    const tagIdsString = tags.map(t => t.id).join(',');

    return `
        <!-- Добавили data-tags и data-url для быстрого доступа -->
        <div class="video-card" data-video-id="${id}" data-tags="${tagIdsString}" data-url="${url || ''}">
            <div class="video-thumb">
                ${thumbnail
                    ? `<img src="${thumbnail}" alt="${title}">`
                    : `<div class="video-thumb-placeholder">Нет превью</div>`}
            </div>

            <h3 class="video-title">
                <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
            </h3>

            <div class="video-tags">
                ${tags.map(t => `<span class="video-tag">${t.name}</span>`).join('')}
            </div>

            <div class="video-actions">
                <button class="video-btn" data-action="share" data-id="${id}">Поделиться</button>
                <button class="video-btn" data-action="edit" data-id="${id}">Редактировать</button>
                <button class="video-btn" data-action="delete" data-id="${id}">Удалить</button>
            </div>
        </div>
    `;
}