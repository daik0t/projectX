import "../style/form.css"

export function tampleFormRender(){

    return (`
        <form id="auth-widget-form">
            <div class = "auth-widget-group">
                <input
                    id = "personalData"
                    type = "text"
                    name = "personalData"
                    placeholder = "почта, номер телефона"
                    required
                >
            </div>
            <div class = "auth-widget-group">
                <input
                    id = "password"
                    type = "text"
                    name = "password"
                    placeholder = "пароль"
                    required
                >
            </div>
            <div>
                <button class = "auth-widget-submit" type="submit">Подтвердить</button>
            </div>
        </form>
    `)
}