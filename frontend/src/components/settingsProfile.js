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