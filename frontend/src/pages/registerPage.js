import { renderAuthPage } from "./authPage";

export function renderRegister({ root = document.getElementById('app') } = {}){

    renderAuthPage({
        root,
        mode: "register",
        title: "Регистрация",
        dividerText: "Регистрация с помощью",
        linkPrompt: "Уже зарегистрированы?",
        linkText: "Войти",
        linkHref: "/login"
    });
}
