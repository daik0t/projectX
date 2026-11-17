export function actionWindowRender() {
    return `
        <div class="action-window-overlay" id="action-window-overlay" aria-hidden="true"></div>
        <div class="action-window" id="action-window" role="menu" aria-label="Действия с видео" aria-hidden="true">
            <button class="btn-action-add" id="btn-action-add" type="button" role="menuitem">Добавить</button>
            <button class="btn-share" id="btn-share" type="button" role="menuitem">Поделиться ссылкой</button>
            <button class="btn-edit" id="btn-edit" type="button" role="menuitem">Редактировать</button>
            <button class="btn-properties" id="btn-properties" type="button" role="menuitem">Свойства</button>
            <button class="btn-del" id="btn-del" type="button" role="menuitem">Удалить</button>
        </div>
    `;
}
