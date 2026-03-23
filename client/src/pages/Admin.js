import Panel from "../components/Panel.js";
import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";
import { apiFetch } from "../ui/api.js";

const { useState, useEffect } = window.React;
const html = window.htm.bind(window.React.createElement);

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

export default function Admin({ setPage, user }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [domainName, setDomainName] = useState("");
  const [credibilityScore, setCredibilityScore] = useState("");

  async function loadSources() {
    try {
      setLoading(true);
      setError(null);

      const rows = await apiFetch("/sources");
      setSources(rows || []);
    } catch (err) {
      setError(err.message || "Failed to load sources.");
      setSources([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

  function handleEdit(source) {
    setDomainName(source.domain_name || "");
    setCredibilityScore(
      source.credibility_score != null ? String(source.credibility_score) : ""
    );
    setMessage(null);
    setError(null);
  }

  function handleClear() {
    setDomainName("");
    setCredibilityScore("");
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(e) {
    e && e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedDomain = domainName.trim().toLowerCase();

    if (!trimmedDomain) {
      setError("Domain name is required.");
      return;
    }

    const parsedScore =
      credibilityScore === "" ? null : Number(credibilityScore);

    if (parsedScore != null && (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100)) {
      setError("Credibility score must be a number between 0 and 100.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/sources", {
        method: "POST",
        body: JSON.stringify({
          domain_name: trimmedDomain,
          credibility_score: parsedScore
        })
      });

      setMessage("Source saved successfully.");
      handleClear();
      await loadSources();
    } catch (err) {
      setError(err.message || "Failed to save source.");
    } finally {
      setSaving(false);
    }
  }

  if (user?.role !== "admin") {
    return html`
      <div className="space-y-6">
        <${Card} title="Admin Access">
          <div className="text-sm text-red-700">
            You do not have permission to view this page.
          </div>
        <//>
      </div>
    `;
  }

  const actions = html`
    <button
      type="button"
      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      onClick=${() => setPage && setPage("dashboard")}
    >
      Back to Dashboard
    </button>
  `;

  return html`
    <div className="space-y-8">
      <${Panel} actions=${actions}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Manage source credibility records for the misinformation detector.
            </p>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400">
            Total sources:
            <span className="font-semibold text-slate-900 dark:text-slate-100"> ${sources.length}</span>
          </div>
        </div>
      <//>

      <${Card} title="Add or Update Source" subtitle="Enter a domain name and credibility score. The existing domains will be updated.">
        ${error && html`
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
            <span className="font-medium">Error:</span> ${error}
          </div>
        `}

        ${message && html`
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-4">
            <span className="font-medium">Success:</span> ${message}
          </div>
        `}

        <form onSubmit=${handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Domain Name
            </label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                type="text"
                value=${domainName}
                onInput=${(e) => setDomainName(e.target.value)}
                placeholder="example.com"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Credibility Score
            </label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value=${credibilityScore}
                onInput=${(e) => setCredibilityScore(e.target.value)}
                placeholder="75"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled=${saving}
              className=${[
                "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white transition",
                saving ? "bg-sky-400 cursor-not-allowed" : theme.button
              ].join(" ")}
            >
              ${saving ? "Saving..." : "Save Source"}
            </button>

            <button
              type="button"
              onClick=${handleClear}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </form>
      <//>

      <${Card} title="Current Sources" subtitle="Click Edit to load a source into the form above.">
        ${loading && html`
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Loading sources...
          </div>
        `}

        ${!loading && sources.length === 0 && html`
          <div className="text-sm text-slate-500 dark:text-slate-400">
            No sources found.
          </div>
        `}

        ${sources.length > 0 && html`
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300 font-semibold">Domain</th>
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300 font-semibold">Score</th>
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300 font-semibold">Last Updated</th>
                  <th className="py-3 text-slate-700 dark:text-slate-300 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                ${sources.map((source) => html`
                  <tr key=${source.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 pr-4 text-slate-900 dark:text-slate-100">
                      ${source.domain_name}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                      ${source.credibility_score != null ? source.credibility_score : "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                      ${source.last_updated ? formatDate(source.last_updated) : "N/A"}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick=${() => handleEdit(source)}
                        className="text-sm text-slate-700 hover:underline dark:text-slate-300"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `}
      <//>
    </div>
  `;
}