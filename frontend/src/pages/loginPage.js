import { renderAuthPage } from "./authPage";

export async function renderLogin() {
    const error = new URLSearchParams(window.location.search).get("error");

    renderAuthPage({
        mode: "login",
        title: "Авторизация",
        dividerText: "Авторизация с помощью",
        linkPrompt: "Не зарегистрированы?",
        linkText: "Регистрация",
        linkHref: "/register",
        message: error
    });
}
