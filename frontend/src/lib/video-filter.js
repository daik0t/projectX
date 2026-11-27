export function hasVideoTag(video, tagId) {
    const id = String(tagId);
    return (video?.tags ?? []).some((tag) => String(tag?.id ?? tag) === id);
}

export function filterVideos(videos, {
    categoryTagId = null,
    filterTagIds = [],
} = {}) {
    if (!Array.isArray(videos) || videos.length === 0) return [];

    const categoryId = categoryTagId ? String(categoryTagId) : null;
    const hasCategory = categoryId && videos.some((video) => hasVideoTag(video, categoryId));
    const effectiveCategory = hasCategory ? categoryId : null;
    const filterIds = [...new Set((filterTagIds ?? []).map(String))];

    return videos.filter((video) => {
        if (effectiveCategory && !hasVideoTag(video, effectiveCategory)) return false;

        if (filterIds.length > 0) {
            const matchesFilter = filterIds.some((id) => hasVideoTag(video, id));
            if (!matchesFilter) return false;
        }

        return true;
    });
}
