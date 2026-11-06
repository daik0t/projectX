import { navigate } from "../routers";
import { getContainer } from "./dom";

export async function openPage(btnOpenId, nav){
    const btn = getContainer(btnOpenId)
    if (!btn) return;
    btn.addEventListener('click', (event) => {
        event.preventDefault();
        navigate(nav);
    })
}

