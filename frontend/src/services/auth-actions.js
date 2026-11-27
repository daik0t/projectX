import { clearSession } from "./session";
import { clearAllMetadata } from "./video-storage";
import { resetFilter } from "./filter";
import { navigate } from "../lib/navigation";

export function logout() {
    clearSession();
    clearAllMetadata();
    resetFilter();
    navigate("/login");
}
