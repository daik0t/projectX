import { deleteVideo } from "../api/video";
import { removeMetadata } from "./video-storage";
import { showToast } from "../lib/ui";

export async function setupDeleteVideo({ id, onSuccess } = {}) {
    try {
        await deleteVideo(id);
        removeMetadata(id);
        if (onSuccess) await onSuccess();
        return true;
    } catch (err) {
        console.error("[delete-video] failed:", err);
        showToast("Не удалось удалить видео: " + err.message, "error");
        return false;
    }
}
