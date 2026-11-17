function toPathSegment(value) {
    return String(value ?? '').trim().replace(/\s+/g, '_');
}

/**
 * Путь в стиле проводника: Пользователь>видео>тег1_тег2>поисковой_запрос
 */
export function buildBreadcrumb({ displayName, tags = [], appliedTagIds = [], query = '' } = {}) {
    const parts = [toPathSegment(displayName) || 'Гость', 'видео'];
    const tagNames = new Map((tags ?? []).map((tag) => [String(tag.id), tag.name]));

    const selectedNames = (appliedTagIds ?? [])
        .map((id) => tagNames.get(String(id)) ?? String(id))
        .map(toPathSegment)
        .filter(Boolean);

    if (selectedNames.length > 0) {
        parts.push(selectedNames.join('_'));
    }

    const search = toPathSegment(query);
    if (search) {
        parts.push(search);
    }

    return parts.join('>');
}

export { toPathSegment };
