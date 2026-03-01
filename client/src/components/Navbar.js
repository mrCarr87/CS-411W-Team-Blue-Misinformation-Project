import { theme } from "../ui/theme.js";

const html = window.htm.bind(window.React.createElement);

export default function Navbar({ setPage }) {
  return html`
    <header className="sticky top-0 z-10 border-b border-slate-300 bg-white/75 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <div className=${"h-9 w-9 rounded-lg text-white grid place-items-center font-semibold shadow-soft bg-gradient-to-br " + theme.accent}>
            MD
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">
              Misinformation Detector
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          
          <button
            type="button"
            onClick=${() => setPage("analyze")}
            className="text-sm text-slate-700 hover:underline"
          >
            Analyze
          </button>

          <button
            type="button"
            onClick=${() => setPage("dashboard")}
            className="text-sm text-slate-700 hover:underline"
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick=${() => setPage("register")}
            className=${"px-3 py-1 text-sm font-medium text-white shadow-soft bg-gradient-to-br " + theme.accent + " hover:opacity-90 transition"}
          >
            Register
          </button>

          <button
            type="button"
            onClick=${() => setPage("login")}
            className=${"px-3 py-1 text-sm font-medium text-white shadow-soft bg-gradient-to-br " + theme.accent + " hover:opacity-90 transition"}
          >
            Login
          </button>

        </div>
      </div>
    </header>
  `;
}