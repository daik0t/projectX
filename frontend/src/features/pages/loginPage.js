import { tampleFormRender } from "../component/tampleForm";
import { socialAuthRender } from "../component/socialAuth";

export async function renderLogin(){

    const container = document.getElementById('app')
    
    container.innerHTML = `
        <div class = "auth-widget-card ">
            <div class = "auth-widget-title">Авторизация</div>
            ${tampleFormRender()}
            <div class = "auth-widget-divider">Авторизация с помощью</div>
            ${socialAuthRender()}
            <hr class="widget-line">
            <div class = "auth-away">
                <label for = "auth-link" class = "auth-away-title">Не зарегистрированы?</label>
                <a id="auth-link" class="auth-away-link" href='/register' data-link>Регистрация</a> 
            </div>
        </div>
    `

}