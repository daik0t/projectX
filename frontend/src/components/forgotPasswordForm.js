import { forgotPassword } from "../api/auth";
import { showFormMessage, setFormLoading } from "../lib/form";

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
            showFormMessage(messageEl, "Введите email", "error");
            return;
        }

        setFormLoading(btn, true, "Отправка...", "Отправить");
        showFormMessage(messageEl, "", null);

        try {
            const res = await forgotPassword({ email });
            // Бэк возвращает { message } — показываем его.
            // Если бэк не отдаёт message — фолбэк ниже.
            showFormMessage(
                messageEl,
                res?.message ?? "Если такой email зарегистрирован, инструкции отправлены.",
                "success"
            );
            form.querySelector("#forgot-email").value = "";
        } catch (err) {
            showFormMessage(messageEl, err.message ?? "Не удалось отправить запрос", "error");
        } finally {
            setFormLoading(btn, false, "Отправка...", "Отправить");
        }
    });
}

