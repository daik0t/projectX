function toPathSegment(value) {
    return String(value ?? '').trim().replace(/\s+/g, '_');
}

export function buildBreadcrumb({
    displayName,
    tags = [],
    categoryTagId = null,
    filterTagIds = [],
} = {}) {
    const parts = [toPathSegment(displayName) || 'Гость', 'видео'];
    const tagNames = new Map((tags ?? []).map((tag) => [String(tag.id), tag.name]));

    const nameFor = (id) => {
        const name = tagNames.get(String(id)) ?? String(id);
        return toPathSegment(name);
    };

    const category = categoryTagId ? nameFor(categoryTagId) : '';
    if (category) parts.push(category);

    const filterNames = [...new Set((filterTagIds ?? []).map(String))]
        .filter((id) => id !== String(categoryTagId ?? ''))
        .map(nameFor)
        .filter(Boolean);

    if (filterNames.length > 0) {
        parts.push(filterNames.join('_'));
    }

    return parts.join('>');
}
