import { theme } from "../ui/theme.js";
const html = window.htm.bind(window.React.createElement);

export default function Navbar() {
  return html`
    <header className="sticky top-0 z-10 border-b border-slate-300 bg-white/75 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className=${"h-9 w-9 text-white grid place-items-center font-semibold shadow-soft bg-gradient-to-br " + theme.accent}>
            MD
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">
              Misinformation Detector
            </div>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          CS 411W Team Blue prototype
        </span>
      </div>
    </header>
  `;
}