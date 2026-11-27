import { navigate } from "../lib/navigation";
import { getContainer } from "./dom";

export function openPage(btnOpenId, nav){
    const btn = getContainer(btnOpenId)
    if (!btn) return;
    btn.addEventListener('click', (event) => {
        event.preventDefault();
        navigate(nav);
    })
}

