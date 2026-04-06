import { theme } from "../ui/theme.js";
const html = window.htm.bind(window.React.createElement);

function scoreBadge(score) {
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
  if (score >= 25) return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
  return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
// c
export default function SavedArticleCard({
  item,
  onOpen,
  onRemove,
  onEdit,
  onSave,
  onCompare,
  showRemove = false,
  showEdit = false,
  showSave = false,
  showCompare = false,
  isCompared = false,
  openLabel = "Open",
}) {
  const domain = item.domain || domainFromUrl(item.url);
  const badge = scoreBadge(item.score ?? 0);

  return html`
    <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ${domain} • ${item.date}
            </div>

            <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words">
              ${item.title}
            </h3>
          </div>

          <div className=${"shrink-0 inline-flex items-center border px-2.5 py-1 text-xs font-medium " + badge}>
            ${item.score ?? 0}/100
          </div>
        </div>

        ${item.note
          ? html`
              <div className="text-sm text-slate-600 dark:text-slate-300">
                ${item.note}
              </div>
            `
          : null}

        ${item.confidence != null
          ? html`
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-700 dark:text-slate-200">Confidence:</span>
                ${item.confidence}%
              </div>
            `
          : null}

        ${item.tag
          ? html`
              <div className="pt-1">
                <span className="inline-flex items-center border px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 dark:border-slate-700">
                  ${item.tag}
                </span>
              </div>
            `
          : null}

        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <button
            type="button"
            onClick=${() => onOpen && onOpen(item)}
            className=${"px-3 py-2 text-sm font-medium transition " + theme.buttonPrimary}
          >
            ${openLabel}
          </button>

          ${showCompare
            ? html`
                <button
                  type="button"
                  onClick=${() => onCompare && onCompare(item)}
                  className=${[
                    "px-3 py-2 text-sm font-medium transition",
                    isCompared
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  ].join(" ")}
                >
                  ${isCompared ? "Selected" : "Compare"}
                </button>
              `
            : null}

          ${showSave
            ? html`
                <button
                  type="button"
                  onClick=${() => onSave && onSave(item)}
                  className="px-3 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition"
                >
                  Save
                </button>
              `
            : null}

          ${showEdit
            ? html`
                <button
                  type="button"
                  onClick=${() => onEdit && onEdit(item)}
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Edit
                </button>
              `
            : null}

          ${showRemove
            ? html`
                <button
                  type="button"
                  onClick=${() => onRemove && onRemove(item)}
                  className=${"px-3 py-2 text-sm font-medium transition " + theme.buttonSecondary}
                >
                  Remove
                </button>
              `
            : null}
        </div>
      </div>
    </article>
  `;
}