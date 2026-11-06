import "shareon/css";

export function actionWindowRender() {
    
    return `
        <div class="action-window-overlay" id="action-window-overlay"></div>
        <div class="action-window" id="action-window">
            <button class="btn-action-add" id="btn-action-add">Добавить</button>
            <button class="btn-share" id="btn-share">
                <div class="shareon web-share" id="shareon"
                    data-url=""
                    data-title="">
                    <a class="web-share">Поделиться ссылкой</a>
                </div>
            </button>
            <button class="btn-edit" id="btn-edit">Редактировать</button>
            <button class="btn-properties" id="btn-properties">Свойства</button>
            <button class="btn-del" id="btn-del">Удалить</button>    
        </div>
    `
}

