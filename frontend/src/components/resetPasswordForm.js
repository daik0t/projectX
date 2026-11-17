import { resetPassword } from "../api/auth";

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
            showMessage(messageEl, "Пароль должен быть не короче 8 символов", "error");
            return;
        }
        if (newPassword !== confirm) {
            showMessage(messageEl, "Пароли не совпадают", "error");
            return;
        }

        setLoading(btn, true);
        showMessage(messageEl, "", null);

        try {
            const res = await resetPassword({ token, newPassword });
            showMessage(
                messageEl,
                res?.message ?? "Пароль изменён. Перенаправляем на вход…",
                "success"
            );
            form.reset();
            setTimeout(() => onSuccess?.(), 1500);
        } catch (err) {
            showMessage(
                messageEl,
                err.message ?? "Не удалось сбросить пароль. Возможно, ссылка истекла.",
                "error"
            );
        } finally {
            setLoading(btn, false);
        }
    });
}

function showMessage(el, text, type) {
    if (!el) return;
    if (!text) {
        el.hidden = true;
        el.textContent = "";
        return;
    }
    el.hidden = false;
    el.textContent = text;
    el.dataset.type = type;
}

function setLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "Сохранение..." : "Сохранить пароль";
}