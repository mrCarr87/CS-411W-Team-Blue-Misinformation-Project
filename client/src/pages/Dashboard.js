import Panel from "../components/Panel.js";
import SavedArticleCard from "../components/SavedArticleCard.js";
import { theme } from "../ui/theme.js";
import { apiFetch } from "../ui/api.js";

const html = window.htm.bind(window.React.createElement);

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  } catch {
    return "Unknown date";
  }
}

function scoreBadge(score) {
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  if (score >= 25) return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function verdictText(score, verdict) {
  if (verdict) return verdict;
  if (score >= 75) return "High Credibility";
  if (score >= 50) return "Moderate Credibility";
  if (score >= 25) return "Low Credibility";
  return "Very Low Credibility";
}

function HistoryCard({ item, onOpen }) {
  const domain = domainFromUrl(item.original_url);
  const score = item.overall_score != null ? Math.round(Number(item.overall_score)) : 0;
  const badge = scoreBadge(score);

  return html`
    <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ${domain} • ${formatDate(item.date_submitted)}
            </div>

            <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words">
              ${item.original_url}
            </h3>
          </div>

          <div className=${"shrink-0 inline-flex items-center border px-2.5 py-1 text-xs font-medium " + badge}>
            ${score}/100
          </div>
        </div>

        <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <span className="font-medium text-slate-700 dark:text-slate-200">Verdict:</span>
            ${verdictText(score, item.verdict)}
          </div>

          <div>
            <span className="font-medium text-slate-700 dark:text-slate-200">Confidence:</span>
            ${item.confidence_level != null ? item.confidence_level + "%" : "N/A"}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick=${() => onOpen(item.original_url)}
            className=${"px-3 py-2 text-sm font-medium transition " + theme.buttonPrimary}
          >
            Open Article
          </button>
        </div>
      </div>
    </article>
  `;
}

export default function Dashboard({ setPage, user }) {
  const [items, setItems] = window.React.useState([]);
  const [historyItems, setHistoryItems] = window.React.useState([]);

  const [loading, setLoading] = window.React.useState(true);
  const [historyLoading, setHistoryLoading] = window.React.useState(true);

  const [error, setError] = window.React.useState(null);
  const [historyError, setHistoryError] = window.React.useState(null);

  async function loadSaved() {
    try {
      setLoading(true);
      setError(null);

      const rows = await apiFetch("/api/saved");

      const mapped = (rows || []).map((r) => ({
        id: r.submission_id,
        title: `Saved analysis #${r.submission_id}`,
        url: r.original_url,
        domain: domainFromUrl(r.original_url),
        date: formatDate(r.date_submitted),
        score: r.overall_score != null ? Math.round(Number(r.overall_score)) : 0,
        note: r.verdict || "Saved analysis",
      }));

      setItems(mapped);
    } catch (e) {
      setError(e.message || "Failed to load saved items.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const rows = await apiFetch("/api/history");
      setHistoryItems(rows || []);
    } catch (e) {
      setHistoryError(e.message || "Failed to load submission history.");
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  window.React.useEffect(() => {
    loadSaved();
    loadHistory();
  }, []);

  function onOpen(item) {
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }

  function onOpenHistory(url) {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function onRemove(item) {
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== item.id));

    try {
      await apiFetch(`/api/save/${item.id}`, { method: "DELETE" });
    } catch (e) {
      setItems(prev);
      alert(e.message || "Failed to remove saved item.");
    }
  }

  const actions = html`
    <button
      type="button"
      className=${"px-3 py-2 text-sm font-medium text-white bg-gradient-to-br " + theme.accent + " hover:opacity-90 transition"}
      onClick=${() => setPage && setPage("analyze")}
    >
      New analysis
    </button>
  `;

  return html`
    <div className="space-y-8">
      <${Panel} actions=${actions}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-800 grid place-items-center overflow-hidden">
              <div className="text-3xl">👤</div>
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome <span className="text-slate-700 dark:text-slate-300">${user?.email || "User"}</span>
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                Review your saved analyses and past submissions in one place.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-center min-w-[120px]">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Saved
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                ${items.length}
              </div>
            </div>

            <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-center min-w-[120px]">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total Submissions
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                ${historyItems.length}
              </div>
            </div>
          </div>
        </div>
      <//>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Saved Links</h2>

          <button
            type="button"
            className="text-sm text-slate-700 hover:underline dark:text-slate-300 dark:hover:underline"
            onClick=${loadSaved}
            disabled=${loading}
          >
            ${loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        ${error && html`
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-medium">Error:</span> ${error}
          </div>
        `}

        ${loading && html`
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Loading saved items...
          </div>
        `}

        ${!loading && !error && items.length === 0 && html`
          <div className="text-sm text-slate-500 dark:text-slate-400">
            No saved analyses yet. Run a new analysis and save it.
          </div>
        `}

        ${items.length > 0 && html`
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            ${items.map((item) => html`
              <${SavedArticleCard}
                key=${item.id}
                item=${item}
                onOpen=${onOpen}
                onRemove=${onRemove}
              />
            `)}
          </div>
        `}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Submission History</h2>

          <button
            type="button"
            className="text-sm text-slate-700 hover:underline dark:text-slate-300 dark:hover:underline"
            onClick=${loadHistory}
            disabled=${historyLoading}
          >
            ${historyLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        ${historyError && html`
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-medium">Error:</span> ${historyError}
          </div>
        `}

        ${historyLoading && html`
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Loading submission history...
          </div>
        `}

        ${!historyLoading && !historyError && historyItems.length === 0 && html`
          <div className="text-sm text-slate-500 dark:text-slate-400">
            No past submissions yet.
          </div>
        `}

        ${historyItems.length > 0 && html`
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            ${historyItems.map((item) => html`
              <${HistoryCard}
                key=${item.submission_id}
                item=${item}
                onOpen=${onOpenHistory}
              />
            `)}
          </div>
        `}
      </section>
    </div>
  `;
}