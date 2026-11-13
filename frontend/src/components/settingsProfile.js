import { getAuth } from "../services/auth-storage";
import { me } from "../api/auth";

export async function renderSettingsProfile(token) {
    // 1) Пытаемся взять свежие данные с бэка
    let user = null;
    try {
        user = await me(token);
    } catch (err) {
        console.warn("[settings-profile] не удалось загрузить с сервера:", err.message);
    }

    // 2) Фолбэк — то, что лежит в localStorage после логина
    if (!user) {
        user = getAuth()?.user ?? null;
    }

    if (!user) {
        return `
        <div class="settings-profile" id="settings-profile">
            <p class="error">Не удалось загрузить профиль. Попробуйте войти заново.</p>
        </div>
        `;
    }

    const displayName = escapeHtml(user.displayName ?? "Без имени");
    const email       = escapeHtml(user.email ?? "—");
    const initial     = (user.displayName ?? "?").trim().charAt(0).toUpperCase() || "?";
    const createdAt   = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("ru-RU", {
              day: "2-digit", month: "long", year: "numeric",
          })
        : null;

    return `
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
                <div class="profile-section-message" id="profile-message" hidden></div>
            </div>
        </div>
    </div>
    `;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[c]));
}

export function initSettingsProfile() {
    const btn = document.getElementById("btn-change-password");
    const msg = document.getElementById("profile-message");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        const email = getAuth()?.user?.email;
        if (!email) {
            showProfileMessage(msg, "Не найден email пользователя", "error");
            return;
        }

        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Отправка...";
        showProfileMessage(msg, "", null);

        try {
            const res = await forgotPassword({ email });
            showProfileMessage(
                msg,
                res?.message ?? `Инструкции отправлены на ${email}`,
                "success"
            );
        } catch (err) {
            showProfileMessage(msg, err.message ?? "Не удалось отправить письмо", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = original;
        }
    });
}

function showProfileMessage(el, text, type) {
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