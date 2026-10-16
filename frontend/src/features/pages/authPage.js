import { authFormRender } from "../components/authForm"; 
import { socialAuthRender } from "../components/socialAuth";
import { initAuthForm } from "../components/authForm";
import { navigate } from "../../routers";

export function renderAuthPage({ mode, title, dividerText, linkText, linkHref, linkPrompt }) {
    const container = document.getElementById('app');

    container.innerHTML = `
        <div class="auth-widget-card">
            <div class="auth-widget-title">${title}</div>
            ${authFormRender(mode)}
            <div class="auth-widget-divider">${dividerText}</div>
            ${socialAuthRender()}
            <hr class="widget-line">
            <div class="auth-away">
                <span class="auth-away-title">${linkPrompt}</span>
                <a id="auth-link" class="auth-away-link" href="${linkHref}" data-link>${linkText}</a>
            </div>
        </div>
    `;

    initAuthForm(mode, (data) => {
        console.log('Успешный ответ сервера:', data);
        // Позже: сохранить токен, если он будет в ответе
        // localStorage.setItem('token', data.token);
        // history.pushState({}, '', '/');
        // router();
        navigate('/');
    });
}