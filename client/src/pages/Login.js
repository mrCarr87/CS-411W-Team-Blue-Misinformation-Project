import Panel from "../components/Panel.js";
import { theme } from "../ui/theme.js";
import Card from "../components/Card.js";

export default function Login ({ setPage }) { 
const actions = html`
    <button
      type="button"
      className=${"px-3 py-2 text-sm font-medium text-white bg-gradient-to-br " + theme.accent + " hover:opacity-90 transition"}
      onClick=${() => setPage && setPage("analyze")}
    >
      Go Back
    </button>
  `;

  return html`
    <div className="space-y-8">

      <${Panel} actions=${actions}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-slate-200 grid place-items-center overflow-hidden">
              <div className="text-3xl">👤</div>
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Login</span>
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
               Please Log in to view your dashboard and previous analyses
              </p>
            </div>
          </div>
        </div>
      <//>
  `;

}