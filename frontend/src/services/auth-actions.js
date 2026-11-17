import { clearSession } from "./session";
import { clearAllMetadata } from "./video-storage";
import { resetFilter } from "./filter";
import { navigate } from "../routers";

export function logout() {
    clearSession();
    clearAllMetadata();
    resetFilter();
    navigate("/login");
}
