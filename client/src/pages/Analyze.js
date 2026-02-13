import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";

const html = window.htm.bind(window.React.createElement);

export default function Analyze() {
  return html`
    <div className="space-y-7">
      <${Card}>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Analyze a link
        </h1>

        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Paste an article URL below. This page is a frontend UI demo.
        </p>

        <form className="space-y-4">
          <div>

            <div
              className=${"mt-2 flex rounded-xl border border-slate-200 bg-white shadow-sm " +
              theme.ring}
            >
              <input
                placeholder="https://example.com/article"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
                spellCheck="false"
                autoCapitalize="off"
                autoCorrect="off"
                inputMode="url"
              />
            </div>

          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className=${[
                "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white transition",
                theme.button,
              ].join(" ")}
            >
              Submit
            </button>

            <button
              type="button"
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </form>
      <//>

      <${Card} title="Preview (placeholder)">
        <div className="text-sm text-slate-600">
          Submit a link above to see a preview here.
        </div>
      <//>
    </div>
  `;
}