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

function verdictText(score, verdict) {
  if (verdict) return verdict;
  if (score >= 75) return "High Credibility";
  if (score >= 50) return "Moderate Credibility";
  if (score >= 25) return "Low Credibility";
  return "Very Low Credibility";
}

export default function Dashboard({ setPage, user }) {
  const [items, setItems] = window.React.useState([]);
  const [historyItems, setHistoryItems] = window.React.useState([]);

  const [loading, setLoading] = window.React.useState(true);
  const [historyLoading, setHistoryLoading] = window.React.useState(true);

  const [error, setError] = window.React.useState(null);
  const [historyError, setHistoryError] = window.React.useState(null);

  const [selectedItem, setSelectedItem] = window.React.useState(null);

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
        note: r.note || r.verdict || "Saved analysis",
        tag: r.tag || r.tags || "",
        textContent: r.text_content || "",
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

      const mapped = (rows || []).map((r) => {
        const score = r.overall_score != null ? Math.round(Number(r.overall_score)) : 0;
        return {
          id: r.submission_id,
          title: r.original_url,
          url: r.original_url,
          domain: domainFromUrl(r.original_url),
          date: formatDate(r.date_submitted),
          score,
          note: verdictText(score, r.verdict),
          confidence: r.confidence_level != null ? Number(r.confidence_level) : null,
        };
      });

      setHistoryItems(mapped);
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

  function onOpenSaved(item) {
    setSelectedItem(item);
  }

  function onOpenHistory(item) {
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }

  function closeModal() {
    setSelectedItem(null);
  }

  async function onRemove(item) {
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== item.id));

    try {
      await apiFetch(`/api/save/${item.id}`, { method: "DELETE" });
      if (selectedItem && selectedItem.id === item.id) {
        closeModal();
      }
    } catch (e) {
      setItems(prev);
      alert(e.message || "Failed to remove saved item.");
    }
  }

  async function onEdit(item) {
    const newTag = window.prompt("Enter a tag:", item.tag || "");
    if (newTag === null) return;

    try {
      await apiFetch(`/api/saved/${item.id}`, {
        method: "POST",
        body: JSON.stringify({ tags: newTag.trim() }),
      });

      await loadSaved();

      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem({
          ...selectedItem,
          tag: newTag.trim(),
        });
      }
    } catch (e) {
      alert(e.message || "Failed to update saved article.");
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
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
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
                onOpen=${onOpenSaved}
                onRemove=${onRemove}
                onEdit=${onEdit}
                showRemove=${true}
                showEdit=${true}
                openLabel="Open"
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
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
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
              <${SavedArticleCard}
                key=${item.id}
                item=${item}
                onOpen=${onOpenHistory}
                showRemove=${false}
                showEdit=${false}
                openLabel="Open Article"
              />
            `)}
          </div>
        `}
      </section>

      ${selectedItem && html`
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick=${closeModal}
        >
          <div
            className="w-full max-w-3xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-xl max-h-[85vh] overflow-hidden"
            onClick=${(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  ${selectedItem.title}
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  ${selectedItem.domain} • ${selectedItem.date}
                </div>
              </div>

              <button
                type="button"
                onClick=${closeModal}
                className="text-sm text-slate-600 hover:underline dark:text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Score:</span> ${selectedItem.score}/100
                </div>

                ${selectedItem.tag
                  ? html`
                      <span className="inline-flex items-center border px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 dark:border-slate-700">
                        ${selectedItem.tag}
                      </span>
                    `
                  : null}
              </div>

              <div className="text-sm text-slate-700 dark:text-slate-300 break-words">
                <span className="font-medium">URL:</span> ${selectedItem.url}
              </div>

              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Summary:</span> ${selectedItem.note || "No summary available."}
              </div>

              <div className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Article Text
                </h4>

                <div className="text-sm leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  ${selectedItem.textContent || "No article text available."}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick=${() => window.open(selectedItem.url, "_blank", "noopener,noreferrer")}
                  className="px-3 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition"
                >
                  Open Original Article
                </button>

                <button
                  type="button"
                  onClick=${closeModal}
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}