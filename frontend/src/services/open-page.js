import { navigate } from "../lib/navigation";
import { getContainer } from "./dom";

export function openPage(btnOpenId, nav, root = document){
    const btn = getContainer(btnOpenId, root)
    if (!btn) return;
    btn.addEventListener('click', (event) => {
        event.preventDefault();
        navigate(nav);
    })
}

