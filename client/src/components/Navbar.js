import { theme, getTheme, toggleTheme } from "../ui/theme.js";

const html = window.htm.bind(window.React.createElement);

export default function Navbar({ setPage, user, onLogout }) {
  const [mode, setMode] = window.React.useState(getTheme());

  function handleThemeToggle() {
    const next = toggleTheme();
    setMode(next);
  }
  return html`
    <header className="sticky top-0 z-10 border-b border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 dark:shadow-md /75 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">

        <div className="flex items-center gap-3">
          <div className=${"h-9 w-9 rounded-lg text-white grid place-items-center font-semibold shadow-soft bg-gradient-to-br " + theme.accent}>
            MD
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Misinformation Detector
            </div>
            ${user && user.email
              ? html`<div className="text-xs text-slate-500 dark:text-slate-400">${user.email}</div>`
              : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
        
        <button
          type="button"
          onClick=${handleThemeToggle}
          className="px-3 py-1 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 transition"
        >
          ${mode === "dark" ? "Light mode" : "Dark mode"}
        </button>

          <button
            type="button"
            onClick=${() => setPage && setPage("analyze")}
            className="text-sm text-slate-700 hover:underline dark:text-slate-200 dark:hover:underline"
          >
            Analyze
          </button>

          ${user
            ? html`
                <button
                  type="button"
                  onClick=${() => setPage && setPage("dashboard")}
                  className="text-sm text-slate-700 hover:underlinedark:text-slate-200"
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick=${() => onLogout && onLogout()}
                  className="px-3 py-1 text-sm font-medium text-white shadow-soft bg-gradient-to-br ${theme.accent} hover:opacity-90 transition"
                >
                  Logout
                </button>
              `
            : html`
                <button
                  type="button"
                  onClick=${() => setPage && setPage("register")}
                  className=${"px-3 py-1 text-sm font-medium text-white shadow-soft bg-gradient-to-br " + theme.accent + " hover:opacity-90 transition"}
                >
                  Register
                </button>

                <button
                  type="button"
                  onClick=${() => setPage && setPage("login")}
                  className=${"px-3 py-1 text-sm font-medium text-white shadow-soft bg-gradient-to-br " + theme.accent + " hover:opacity-90 transition"}
                >
                  Login
                </button>
              `}
        </div>
      </div>
    </header>
  `;
}