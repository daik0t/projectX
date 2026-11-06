import { renderAuthPage } from "./authPage";

export async function renderLogin() {
    renderAuthPage({
        mode: "login",
        title: "Авторизация",
        dividerText: "Авторизация с помощью",
        linkPrompt: "Не зарегистрированы?",
        linkText: "Регистрация",
        linkHref: "/register"
    });
}