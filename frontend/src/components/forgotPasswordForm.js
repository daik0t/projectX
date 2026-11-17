import { forgotPassword } from "../api/auth";

export function forgotPasswordFormRender() {
    return `
    <form id="forgot-form">
        <p class="auth-widget-hint">
            Введите email, указанный при регистрации. Мы пришлём ссылку для сброса пароля.
        </p>
        <div class="auth-widget-group">
            <input
                id="forgot-email"
                type="email"
                name="email"
                placeholder="почта"
                aria-label="Email"
                autocomplete="email"
                maxlength="255"
                required
            >
        </div>
        <div class="auth-widget-message" id="forgot-message" role="alert" aria-live="polite" hidden></div>
        <div>
            <button class="auth-widget-submit" type="submit">Отправить</button>
        </div>
    </form>
    `;
}

export function initForgotPasswordForm() {
    const form = document.getElementById("forgot-form");
    const messageEl = document.getElementById("forgot-message");
    const btn = form?.querySelector(".auth-widget-submit");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = new FormData(form).get("email")?.toString().trim() ?? "";
        if (!email) {
            showMessage(messageEl, "Введите email", "error");
            return;
        }

        setLoading(btn, true);
        showMessage(messageEl, "", null);

        try {
            const res = await forgotPassword({ email });
            // Бэк возвращает { message } — показываем его.
            // Если бэк не отдаёт message — фолбэк ниже.
            showMessage(
                messageEl,
                res?.message ?? "Если такой email зарегистрирован, инструкции отправлены.",
                "success"
            );
            form.querySelector("#forgot-email").value = "";
        } catch (err) {
            showMessage(messageEl, err.message ?? "Не удалось отправить запрос", "error");
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
    btn.textContent = isLoading ? "Отправка..." : "Отправить";
}