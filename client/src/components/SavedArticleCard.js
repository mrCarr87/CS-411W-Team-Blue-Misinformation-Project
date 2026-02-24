import { theme } from "../ui/theme.js";
const html = window.htm.bind(window.React.createElement);

function scoreBadge(score) {
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function domainFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "unknown"; }
}

export default function SavedArticleCard({ item, onOpen, onRemove }) {
  const domain = item.domain || domainFromUrl(item.url);
  const badge = scoreBadge(item.score ?? 0);

  return html`
    <article className="border border-slate-300 bg-white">

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">
              ${domain} - ${item.date}
            </div>
            <h3 className="mt-1 text-base font-semibold text-slate-900 leading-snug">
              ${item.title}
            </h3>
          </div>

          <div className=${"shrink-0 inline-flex items-center border px-2.5 py-1 text-xs font-medium " + badge}>
            ${item.score ?? 0}/100
          </div>
        </div>

        <div className="text-sm text-slate-600">
          ${item.note || "Saved result (demo data)."}
        </div>

        <div className="flex items-center gap-2 pt-2">

        <button
            type="button"
            onClick=${() => onOpen(item)}
            className=${"px-3 py-2 text-sm font-medium transition " + theme.buttonPrimary}
            >
            Open
        </button>

        <button
            type="button"
            onClick=${() => onRemove(item)}
            className=${"px-3 py-2 text-sm font-medium transition " + theme.buttonSecondary}
            >
            Remove
        </button>
        </div>
      </div>
    </article>
  `;
}