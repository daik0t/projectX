import { resetPasswordFormRender, initResetPasswordForm } from "../components/resetPasswordForm";
import { navigate } from "../routers";

export async function renderResetPassword({ query } = {}) {
    const container = document.getElementById("app");

    const token =
        query?.token ??
        new URLSearchParams(location.search).get("token") ??
        "";

    container.innerHTML = `
        <div class="auth-widget-card">
            <div class="auth-widget-title">Новый пароль</div>
            ${resetPasswordFormRender({ token })}
            <hr class="widget-line">
            <div class="auth-away">
                <a href="/login" class="auth-away-link" data-link>← Вернуться ко входу</a>
            </div>
        </div>
    `;

    initResetPasswordForm({
        token,
        onSuccess: () => navigate("/login"),
    });
}