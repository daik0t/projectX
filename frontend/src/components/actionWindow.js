export function actionWindowRender() {
    return `
        <div class="action-window-overlay" id="action-window-overlay"></div>
        <div class="action-window" id="action-window">
            <button class="btn-action-add" id="btn-action-add" type="button">Добавить</button>
            <button class="btn-share" id="btn-share" type="button">Поделиться ссылкой</button>
            <button class="btn-edit" id="btn-edit" type="button">Редактировать</button>
            <button class="btn-properties" id="btn-properties" type="button">Свойства</button>
            <button class="btn-del" id="btn-del" type="button">Удалить</button>
        </div>
    `;
}
