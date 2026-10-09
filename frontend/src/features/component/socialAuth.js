import "../style/form.css"
import "../style/socialauth.css"


export function socialAuthRender() {
    return (`
            <div class = "auth-widget-socials">
                <button type="button" class="auth-widget-btn btn-social" onclick="alert('Вход через Google...')">
                    <img src="https://img.icons8.ru/?size=30&id=17949&format=png&color=000000">
                </button>
                <button type="button" class="auth-widget-btn btn-social" onclick="alert('Вход через GitHub...')">
                    <img src="https://img.icons8.ru/?size=30&id=12599&format=png&color=000000">
                </button>
            </div>
    `)
}