import { getAuth } from "../services/auth-storage";
import { me, forgotPassword } from "../api/auth";
import { escapeHtml } from "../lib/html";
import { showFormMessage } from "../lib/form";

export async function renderSettingsProfile() {
    let user = null;
    try {
        user = await me();
    } catch (err) {
        console.warn("[settings-profile] не удалось загрузить с сервера:", err.message);
    }

    if (!user) {
        user = getAuth()?.user ?? null;
    }

    if (!user) {
        return {
            html: `
        <div class="settings-profile" id="settings-profile">
            <p class="error">Не удалось загрузить профиль. Попробуйте войти заново.</p>
        </div>
        `,
            profile: null,
        };
    }

    const displayName = escapeHtml(user.displayName ?? "Без имени");
    const email       = escapeHtml(user.email ?? "—");
    const initial     = escapeHtml((user.displayName ?? "?").trim().charAt(0).toUpperCase() || "?");
    const createdAt   = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("ru-RU", {
              day: "2-digit", month: "long", year: "numeric",
          })
        : null;

    return {
        html: `
    <div class="settings-profile" id="settings-profile">
        <div class="profile-card">
            <div class="profile-avatar" aria-hidden="true">${initial}</div>
            <div class="profile-info">
                <div class="profile-name">${displayName}</div>
                <div class="profile-email">${email}</div>
                ${createdAt ? `
                <div class="profile-meta">
                    <span class="profile-meta-label">Дата регистрации:</span>
                    <span class="profile-meta-value">${createdAt}</span>
                </div>` : ""}
            </div>
        </div>
        <div class="profile-section">
            <div class="profile-section-title">Безопасность</div>
            <div class="profile-section-body">
                <p class="profile-section-hint">
                    Мы отправим на ваш email ссылку для смены пароля.
                </p>
                <button class="profile-action-btn" id="btn-change-password" type="button">
                    Сменить пароль
                </button>
                <div class="profile-section-message" id="profile-message" role="alert" aria-live="polite" hidden></div>
            </div>
        </div>
    </div>
    `,
        profile: user,
    };
}

export function initSettingsProfile(profile = null) {
    const btn = document.getElementById("btn-change-password");
    const msg = document.getElementById("profile-message");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        let email = profile?.email ?? getAuth()?.user?.email ?? null;

        if (!email) {
            showFormMessage(msg, "Не найден email пользователя", "error");
            return;
        }

        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Отправка...";
        showFormMessage(msg, "", null);

        try {
            const res = await forgotPassword({ email });
            showFormMessage(
                msg,
                res?.message ?? `Инструкции отправлены на ${email}`,
                "success"
            );
        } catch (err) {
            showFormMessage(msg, err.message ?? "Не удалось отправить письмо", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = original;
        }
    });
}

