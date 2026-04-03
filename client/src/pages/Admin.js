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

function statusBadge(active) {
  return active
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700";
}

export default function Admin({ setPage, user }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowSaving, setRowSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [domainName, setDomainName] = useState("");
  const [credibilityScore, setCredibilityScore] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDomainName, setEditDomainName] = useState("");
  const [editCredibilityScore, setEditCredibilityScore] = useState("");

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

    if (
      parsedScore != null &&
      (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100)
    ) {
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

  function startInlineEdit(source) {
    setEditingId(source.id);
    setEditDomainName(source.domain_name || "");
    setEditCredibilityScore(
      source.credibility_score != null ? String(source.credibility_score) : ""
    );
    setMessage(null);
    setError(null);
  }

  function cancelInlineEdit() {
    setEditingId(null);
    setEditDomainName("");
    setEditCredibilityScore("");
  }

  async function saveInlineEdit(source) {
    const trimmedDomain = editDomainName.trim().toLowerCase();

    if (!trimmedDomain) {
      setError("Domain name is required.");
      return;
    }

    const parsedScore =
      editCredibilityScore === "" ? null : Number(editCredibilityScore);

    if (
      parsedScore != null &&
      (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100)
    ) {
      setError("Credibility score must be a number between 0 and 100.");
      return;
    }

    try {
      setRowSaving(true);
      setError(null);
      setMessage(null);

      await apiFetch("/sources", {
        method: "POST",
        body: JSON.stringify({
          domain_name: trimmedDomain,
          credibility_score: parsedScore,
          active: Number(source.active) === 1 ? 1 : 0
        })
      });

      setMessage("Source updated successfully.");
      cancelInlineEdit();
      await loadSources();
    } catch (err) {
      setError(err.message || "Failed to update source.");
    } finally {
      setRowSaving(false);
    }
  }

  async function handleDelete(source) {
    const confirmed = window.confirm(`Deactivate source "${source.domain_name}"?`);
    if (!confirmed) return;

    try {
      setError(null);
      setMessage(null);

      await apiFetch(`/sources/${source.id}`, {
        method: "DELETE",
      });

      if (editingId === source.id) {
        cancelInlineEdit();
      }

      setMessage("Source deactivated successfully.");
      await loadSources();
    } catch (err) {
      setError(err.message || "Failed to deactivate source.");
    }
  }

  async function handleRestore(source) {
    try {
      setError(null);
      setMessage(null);

      await apiFetch("/sources", {
        method: "POST",
        body: JSON.stringify({
          domain_name: source.domain_name,
          credibility_score: source.credibility_score,
          active: 1,
        })
      });

      setMessage("Source restored successfully.");
      await loadSources();
    } catch (err) {
      setError(err.message || "Failed to restore source.");
    }
  }

  if (user?.role !== "admin") {
    return html`
      <div className="space-y-6">
        <${Card} title="Admin Access">
          <div className="text-sm text-red-700 dark:text-red-400">
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

      <${Card} title="Add New Source" subtitle="Use this form to add a new source. Existing sources can be edited directly in the table below.">
        ${error && html`
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            <span className="font-medium">Error:</span> ${error}
          </div>
        `}

        ${message && html`
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-4 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300">
            <span className="font-medium">Success:</span> ${message}
          </div>
        `}

        <form onSubmit=${handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Domain Name
            </label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-sm " + theme.ring}>
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
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-sm " + theme.ring}>
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

      <${Card} title="Current Sources" subtitle="Inactive sources are muted. Edit directly in the row.">
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
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300 font-semibold">Status</th>
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300 font-semibold">Last Updated</th>
                  <th className="py-3 text-slate-700 dark:text-slate-300 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                ${sources.map((source) => {
                  const isActive = Number(source.active) === 1;
                  const isEditing = editingId === source.id;

                  return html`
                    <tr
                      key=${source.id}
                      className=${[
                        "border-b dark:border-slate-800 transition-colors",
                        isActive
                          ? "border-slate-100 bg-transparent"
                          : "border-slate-200 bg-slate-50/70 dark:bg-slate-800/25"
                      ].join(" ")}
                    >
                      <td className="py-3 pr-4">
                        ${isEditing
                          ? html`
                              <input
                                type="text"
                                value=${editDomainName}
                                onInput=${(e) => setEditDomainName(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              />
                            `
                          : html`
                              <span className=${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}>
                                ${source.domain_name}
                              </span>
                            `}
                      </td>

                      <td className="py-3 pr-4">
                        ${isEditing
                          ? html`
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value=${editCredibilityScore}
                                onInput=${(e) => setEditCredibilityScore(e.target.value)}
                                className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              />
                            `
                          : html`
                              <span className=${isActive ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}>
                                ${source.credibility_score != null ? source.credibility_score : "N/A"}
                              </span>
                            `}
                      </td>

                      <td className="py-3 pr-4">
                        <span className=${"inline-flex items-center border px-2.5 py-1 text-xs font-medium " + statusBadge(isActive)}>
                          ${isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-3 pr-4">
                        <span className=${isActive ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}>
                          ${source.last_updated ? formatDate(source.last_updated) : "N/A"}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          ${isEditing
                            ? html`
                                <button
                                  type="button"
                                  onClick=${() => saveInlineEdit(source)}
                                  disabled=${rowSaving}
                                  className=${[
                                    "text-sm font-medium",
                                    rowSaving
                                      ? "text-slate-400 cursor-not-allowed"
                                      : "text-emerald-700 hover:underline dark:text-emerald-400"
                                  ].join(" ")}
                                >
                                  ${rowSaving ? "Saving..." : "Save"}
                                </button>

                                <button
                                  type="button"
                                  onClick=${cancelInlineEdit}
                                  className="text-sm text-slate-700 hover:underline dark:text-slate-300"
                                >
                                  Cancel
                                </button>
                              `
                            : html`
                                <button
                                  type="button"
                                  onClick=${() => startInlineEdit(source)}
                                  className="text-sm text-slate-700 hover:underline dark:text-slate-300"
                                >
                                  Edit
                                </button>

                                ${isActive
                                  ? html`
                                      <button
                                        type="button"
                                        onClick=${() => handleDelete(source)}
                                        className="text-sm text-red-600 hover:underline dark:text-red-400"
                                      >
                                        Delete
                                      </button>
                                    `
                                  : html`
                                      <button
                                        type="button"
                                        onClick=${() => handleRestore(source)}
                                        className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                                      >
                                        Restore
                                      </button>
                                    `}
                              `}
                        </div>
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
        `}
      <//>
    </div>
  `;
}