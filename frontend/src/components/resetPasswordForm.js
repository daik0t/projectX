import { resetPassword } from "../api/auth";
import { showFormMessage, setFormLoading } from "../lib/form";

export function resetPasswordFormRender({ token }) {
    if (!token) {
        return `
        <div class="auth-widget-message" data-type="error" role="alert">
            Ссылка недействительна: отсутствует токен.
            <div><a href="/forgot-password" data-link>Запросить новую ссылку</a></div>
        </div>
        `;
    }

    return `
    <form id="reset-form">
        <p class="auth-widget-hint">Придумайте новый пароль (минимум 8 символов).</p>
        <div class="auth-widget-group">
            <input
                id="reset-password"
                type="password"
                name="newPassword"
                placeholder="новый пароль"
                aria-label="Новый пароль"
                autocomplete="new-password"
                minlength="8"
                maxlength="100"
                required
            >
        </div>
        <div class="auth-widget-group">
            <input
                id="reset-password-confirm"
                type="password"
                name="confirm"
                placeholder="повторите пароль"
                aria-label="Повторите новый пароль"
                autocomplete="new-password"
                minlength="8"
                maxlength="100"
                required
            >
        </div>
        <div class="auth-widget-message" id="reset-message" role="alert" aria-live="polite" hidden></div>
        <div>
            <button class="auth-widget-submit" type="submit">Сохранить пароль</button>
        </div>
    </form>
    `;
}

export function initResetPasswordForm({ token, onSuccess }) {
    const form = document.getElementById("reset-form");
    if (!form) return; // нет токена — рендер уже показал ошибку

    const messageEl = document.getElementById("reset-message");
    const btn = form.querySelector(".auth-widget-submit");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fd = new FormData(form);
        const newPassword = fd.get("newPassword")?.toString() ?? "";
        const confirm = fd.get("confirm")?.toString() ?? "";

        if (newPassword.length < 8) {
            showFormMessage(messageEl, "Пароль должен быть не короче 8 символов", "error");
            return;
        }
        if (newPassword !== confirm) {
            showFormMessage(messageEl, "Пароли не совпадают", "error");
            return;
        }

        setFormLoading(btn, true, "Сохранение...", "Сохранить пароль");
        showFormMessage(messageEl, "", null);

        try {
            const res = await resetPassword({ token, newPassword });
            showFormMessage(
                messageEl,
                res?.message ?? "Пароль изменён. Перенаправляем на вход…",
                "success"
            );
            form.reset();
            setTimeout(() => onSuccess?.(), 1500);
        } catch (err) {
            showFormMessage(
                messageEl,
                err.message ?? "Не удалось сбросить пароль. Возможно, ссылка истекла.",
                "error"
            );
        } finally {
            setFormLoading(btn, false, "Сохранение...", "Сохранить пароль");
        }
    });
}

