import { deleteVideo } from "../api/video";
import { removeMetadata } from "./video-storage";
import { showToast } from "../lib/ui";

export async function setupDeleteVideo({ token, id, onSuccess }) {
    try {
        await deleteVideo(token, id);
        removeMetadata(id);
        if (onSuccess) await onSuccess();
    } catch (err) {
        console.error("[delete-video] failed:", err);
        showToast("Не удалось удалить видео: " + err.message, "error");
    }
}
