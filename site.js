(() => {
const historyStorageKey = "spanlab-calculation-history";
const themeStorageKey = "spanlab-theme";
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");

function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = selectedTheme;
    const isDark = selectedTheme === "dark";
    themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
}

themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
        localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
        console.warn("The selected theme could not be saved.", error);
    }
});

try {
    applyTheme(localStorage.getItem(themeStorageKey));
} catch (error) {
    console.warn("The saved theme could not be loaded.", error);
    applyTheme("light");
}

const homeHistoryCount = document.getElementById("homeHistoryCount");
if (homeHistoryCount) {
    try {
        const history = JSON.parse(localStorage.getItem(historyStorageKey) || "[]");
        homeHistoryCount.textContent = String(Array.isArray(history) ? history.length : 0);
    } catch (error) {
        console.warn("The saved calculation count could not be loaded.", error);
        homeHistoryCount.textContent = "0";
    }
}
})();
