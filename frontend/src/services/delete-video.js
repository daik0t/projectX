import { deleteVideo } from "../api/video";
import { removeMetadata } from "./video-storage";


export async function setupDeleteVideo({ token, id, onSuccess }) {
        try {
            await deleteVideo(token,id);
            removeMetadata(id)
            if (onSuccess) await onSuccess();
        } catch (err) {
            console.error(err);
            alert('');
        }
}
