import { resetPasswordFormRender, initResetPasswordForm } from "../components/resetPasswordForm";
import { navigate } from "../lib/navigation";

export function renderResetPassword({
    root = document.getElementById("app"),
    params = {},
} = {}) {
    if (!root) return;

    const token =
        params?.token ??
        new URLSearchParams(location.search).get("token") ??
        "";

    root.innerHTML = `
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
        root,
    });
}