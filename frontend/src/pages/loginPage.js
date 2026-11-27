import { renderAuthPage } from "./authPage";

export function renderLogin({ root = document.getElementById('app') } = {}) {
    const error = new URLSearchParams(window.location.search).get("error");

    renderAuthPage({
        root,
        mode: "login",
        title: "Авторизация",
        dividerText: "Авторизация с помощью",
        linkPrompt: "Не зарегистрированы?",
        linkText: "Регистрация",
        linkHref: "/register",
        message: error
    });
}
