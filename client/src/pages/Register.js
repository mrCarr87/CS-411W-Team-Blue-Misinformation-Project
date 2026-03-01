import Panel from "../components/Panel.js";
import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";

const html = window.htm.bind(window.React.createElement);

export default function Register({ setPage }) {
  const actions = html`
    <button
      type="button"
      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      onClick=${() => setPage && setPage("login")}
    >
      Already have an account?
    </button>
  `;

  return html`
    <div className="space-y-8">

      <${Panel} actions=${actions}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Register
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Create an account to save and revisit your credibility analyses.
              </p>
            </div>
          </div>
        </div>
      <//>

      <${Card} title="Create Account" subtitle="Use a valid email and a secure password.">
        <form className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                type="email"
                placeholder="you@odu.edu"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                type="password"
                placeholder="At least 6 characters"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                type="password"
                placeholder="Repeat password"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              className=${[
                "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white transition",
                theme.button
              ].join(" ")}
            >
              Register
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

    </div>
  `;
}