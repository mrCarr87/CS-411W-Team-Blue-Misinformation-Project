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
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return "Unknown date";
  }
}

export default function Dashboard({ setPage, user }) {
  const [items, setItems] = window.React.useState([]);
  const [loading, setLoading] = window.React.useState(true);
  const [error, setError] = window.React.useState(null);

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

  window.React.useEffect(() => {
    loadSaved();
  }, []);

  function onOpen(item) {
    if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-slate-200 grid place-items-center overflow-hidden">
              <div className="text-3xl">👤</div>
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Welcome <span className="text-slate-700">${user?.email || "User"}</span>
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Here are your saved analyses pulled from the database.
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-600">
            Saved items: <span className="font-semibold text-slate-900">${items.length}</span>
          </div>
        </div>
      <//>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Saved Links</h2>

        <button
          type="button"
          className="text-sm text-slate-700 hover:underline"
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

      ${loading && html`<div className="text-sm text-slate-500">Loading saved items...</div>`}

      ${!loading && !error && items.length === 0 && html`
        <div className="text-sm text-slate-500">
          No saved analyses yet. Run a new analysis and save it.
        </div>
      `}

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
    </div>
  `;
}