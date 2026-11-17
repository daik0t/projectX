const ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/**
 * Экранирует значение для вставки в HTML-шаблон.
 * Использовать для любых данных, пришедших от пользователя или из API.
 */
export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}
