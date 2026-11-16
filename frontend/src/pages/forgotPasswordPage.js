import { forgotPasswordFormRender, initForgotPasswordForm } from "../components/forgotPasswordForm";

export async function renderForgotPassword() {
    const container = document.getElementById("app");

    container.innerHTML = `
        <div class="auth-widget-card">
            <div class="auth-widget-title">Восстановление пароля</div>
            ${forgotPasswordFormRender()}
            <hr class="widget-line">
            <div class="auth-away">
                <a href="/login" class="auth-away-link" data-link>← Вернуться ко входу</a>
            </div>
        </div>
    `;

    initForgotPasswordForm();
}