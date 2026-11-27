import { renderAuthPage } from "./authPage";

export function renderRegister(){

    renderAuthPage({
        mode: "register",
        title: "Регистрация",
        dividerText: "Регистрация с помощью",
        linkPrompt: "Уже зарегистрированы?",
        linkText: "Войти",
        linkHref: "/login"
    });
}
