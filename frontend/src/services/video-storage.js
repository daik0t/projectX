const STORAGE_KEY = 'yt_metadata';

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('localStorage save failed', e);
  }
}


export function saveMetadata(videoId, metadata, sourceUrl, tags) {
  const cache = loadCache();
  cache[videoId] = {
    ...metadata,
    id: videoId,
    url: sourceUrl, 
    tags: tags,
    savedAt: Date.now(),
  };
  saveCache(cache);
}


export function getMetadata(videoId) {
  return loadCache()[videoId] || null;
}

export function removeMetadata(videoId) {
  const cache = loadCache();
  if (!(videoId in cache)) return false;
  delete cache[videoId];
  saveCache(cache);
  return true;
}

export async function clearAllMetadata() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('localStorage clear failed', e);
  }
}