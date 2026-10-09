import { tampleFormRender } from "../component/tampleForm";
import { socialAuthRender } from "../component/socialAuth";
import "../style/form.css"


export async function renderRegister(){

    const container = document.getElementById('app')
    
    container.innerHTML = `
        <div class = "auth-widget-card ">
            <div class = "auth-widget-title">Регистрация</div>
            ${tampleFormRender()}
            <div class = "auth-widget-divider">Регистрация с помощью</div>
            ${socialAuthRender()}
            <hr class="widget-line">
            <div class = "auth-away">
                <label for = "auth-link" class = "auth-away-title">Уже зарегистрированы?</label>
                <a id="auth-link" class="auth-away-link" href='/login' data-link>Войти</a> 
            </div>
        </div>
    `
}