import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";
import { apiFetch } from "../ui/api.js";

const { useState, useCallback } = window.React;
const html = window.htm.bind(window.React.createElement);

// ── Score colour helper ───────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 75) return { text: "text-emerald-600", bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "High Credibility" };
  if (score >= 50) return { text: "text-amber-600",  bar: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 border-amber-200",   label: "Moderate Credibility" };
  if (score >= 25) return { text: "text-orange-600", bar: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200", label: "Low Credibility" };
  return               { text: "text-red-600",    bar: "bg-red-500",    badge: "bg-red-50 text-red-700 border-red-200",       label: "Very Low Credibility" };
}

function ScoreMeter({ score }) {
  const c = scoreColor(score);
  return html`
    <div className="flex items-center gap-5">
      <div className="shrink-0 text-center w-20">
        <span className=${"text-5xl font-bold tabular-nums " + c.text}>${score}</span>
        <div className="text-xs text-slate-400 mt-0.5">/ 100</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className=${"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium mb-2 " + c.badge}>
          ${c.label}
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className=${"h-full rounded-full transition-all duration-700 " + c.bar}
            style=${{ width: score + "%" }}
          />
        </div>
      </div>
    </div>
  `;
}

function TextAnalysis({ analysis }) {
  if (!analysis) return null;

  return html`
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">📊 Content Analysis</h3>
      </div>
      <div className="px-4 py-3 space-y-4">
        ${analysis.aiGenerated && html`
          <div className="pb-3 border-b border-slate-200">
            <div className="text-xs text-slate-500 mb-2">🤖 AI-Generated Content Detection</div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-6 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className=${analysis.aiGenerated.probability >= 80 ? "bg-red-500" :
                      analysis.aiGenerated.probability >= 65 ? "bg-orange-500" : "bg-amber-500"}
                    style=${{ width: analysis.aiGenerated.probability + "%" }}
                  />
                </div>
              </div>
              <div className="text-sm font-semibold" style=${{ minWidth: "60px" }}>
                ${analysis.aiGenerated.probability}% AI
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Confidence: ${analysis.aiGenerated.confidence} (${analysis.aiGenerated.samplesAnalyzed} samples)
            </div>
          </div>
        `}

        ${analysis.claimsVsOpinion && html`
          <div>
            <div className="text-xs text-slate-500 mb-1">Claims vs Opinion</div>
            <div className="flex gap-2 h-6 rounded-full overflow-hidden bg-slate-100">
              <div className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                   style=${{ width: analysis.claimsVsOpinion.claims + "%" }}>
                ${analysis.claimsVsOpinion.claims > 15 ? analysis.claimsVsOpinion.claims + "% Facts" : ""}
              </div>
              <div className="bg-purple-500 flex items-center justify-center text-white text-xs font-medium"
                   style=${{ width: analysis.claimsVsOpinion.opinion + "%" }}>
                ${analysis.claimsVsOpinion.opinion > 15 ? analysis.claimsVsOpinion.opinion + "% Opinion" : ""}
              </div>
            </div>
          </div>
        `}

        ${analysis.factVsSpeculation && html`
          <div>
            <span className="text-xs text-slate-500">Fact vs Speculation: </span>
            <span className=${"text-xs font-medium " +
              (analysis.factVsSpeculation === "clear" ? "text-green-600" :
               analysis.factVsSpeculation === "mixed" ? "text-amber-600" : "text-red-600")}>
              ${analysis.factVsSpeculation}
            </span>
          </div>
        `}

        ${analysis.sourceCitations && html`
          <div>
            <span className="text-xs text-slate-500">Source Citations: </span>
            <span className=${"text-xs font-medium " +
              (analysis.sourceCitations === "strong" ? "text-green-600" :
               analysis.sourceCitations === "weak" ? "text-amber-600" : "text-red-600")}>
              ${analysis.sourceCitations}
            </span>
          </div>
        `}

        ${analysis.exampleClaim && html`
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-1">Example Claim:</div>
            <div className="text-sm text-slate-700 italic">"${analysis.exampleClaim}"</div>
          </div>
        `}

        ${analysis.exampleOpinion && html`
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-1">Example Opinion:</div>
            <div className="text-sm text-slate-700 italic">"${analysis.exampleOpinion}"</div>
          </div>
        `}
      </div>
    </div>
  `;
}

function ReasonsAccordion({ reasons, metadata }) {
  const [open, setOpen] = useState(false);

  return html`
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick=${() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <span className="text-sm font-medium text-slate-700">Why this score?</span>
        <svg className=${"h-4 w-4 text-slate-400 transition-transform duration-200 " + (open ? "rotate-180" : "")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      ${open && html`
        <div className="px-4 pt-3 pb-4 space-y-2 bg-white border-t border-slate-100">
          ${(metadata?.domain || metadata?.published) && html`
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
              ${metadata.domain && html`<span><span className="font-medium text-slate-700">Source:</span> ${metadata.domain}</span>`}
              ${metadata.published && html`<span><span className="font-medium text-slate-700">Published:</span> ${metadata.published}</span>`}
            </div>
          `}
          <ul className="space-y-2">
            ${reasons.map((r, i) => html`
              <li key=${i} className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                ${r}
              </li>
            `)}
          </ul>
        </div>
      `}
    </div>
  `;
}

// ── Shared results block — used by both tabs ──────────────────────────────────
function ResultsCard({ loading, result, error }) {
  return html`
    <${Card} title=${result ? "Credibility Analysis" : "Results"}>
      ${!result && !error && !loading && html`
        <div className="text-sm text-slate-500">
          Submit a link or paste article text above to see an AI credibility analysis here.
        </div>
      `}

      ${loading && html`
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <svg className="h-4 w-4 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Fetching and analyzing source…
        </div>
      `}

      ${error && html`
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Error:</span> ${error}
        </div>
      `}

      ${result && html`
        <div className="space-y-5">
          ${result.contentBlocked && html`
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm font-semibold text-amber-800">⚠ Content retrieval was blocked</p>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                This site blocked our ability to read the article content. The credibility score below is based on
                <strong> domain reputation and publication date only</strong> — we were unable to evaluate the article itself for bias, accuracy, or misleading claims.
              </p>
            </div>
          `}

          <${ScoreMeter} score=${result.score} />

          ${result.redditTrending && html`
            <div className="flex items-start gap-3 rounded-xl border-2 ${result.redditTrending.level === "high" ? "border-orange-300 bg-orange-50" : "border-sky-300 bg-sky-50"} px-4 py-3">
              <svg className=${"mt-0.5 h-5 w-5 shrink-0 " + (result.redditTrending.level === "high" ? "text-orange-500" : "text-sky-500")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className=${"text-sm font-semibold " + (result.redditTrending.level === "high" ? "text-orange-800" : "text-sky-800")}>
                  ⚡ ${result.redditTrending.level === "high" ? "Actively Trending on Reddit" : "Recently Trending on Reddit"}
                </p>
                <p className=${"text-xs mt-0.5 " + (result.redditTrending.level === "high" ? "text-orange-700" : "text-sky-700")}>
                  ${result.redditTrending.message}
                </p>
              </div>
            </div>
          `}

          ${result.biasWarning && html`
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-4 9 4v6c0 5-4 8.5-9 10C7 20.5 3 17 3 12V6z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-orange-800">Bias notice</p>
                <p className="text-xs text-orange-700 mt-0.5">${result.biasWarning}</p>
              </div>
            </div>
          `}

          ${result.analysis && html`<${TextAnalysis} analysis=${result.analysis} />`}
          <${ReasonsAccordion} reasons=${result.reasons} metadata=${result.metadata} />
        </div>
      `}
    <//>
  `;
}

// ── URL tab — your original Analyze logic, untouched ─────────────────────────
function UrlTab() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  const handleSubmit = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setSaveMessage(null);

    try {
      const data = await apiFetch("/api/submit", {
        method: "POST",
        body: JSON.stringify({ url: url.trim(), source: "web" }),
      });

      setResult({
        ...data,
        saved: false,
      });
    } catch (err) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleSave = useCallback(async () => {
    if (!result?.submissionId) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      await apiFetch(`/api/save/${result.submissionId}`, {
        method: "POST",
      });

      setResult((prev) => prev ? { ...prev, saved: true } : prev);
      setSaveMessage("Article saved to your dashboard.");
    } catch (err) {
      setSaveMessage(err.message || "Failed to save article.");
    } finally {
      setSaving(false);
    }
  }, [result]);

  const handleClear = useCallback(() => {
    setUrl("");
    setResult(null);
    setError(null);
    setSaveMessage(null);
  }, []);

  return html`
    <div className="space-y-7">
      <${Card}>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Analyze a link
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Paste an article URL below. AI will evaluate the source's credibility
          based on the publisher, publication date, and content.
        </p>

        <div className="space-y-4 mt-4">
          <div className=${"flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
            <input
              value=${url}
              onInput=${(e) => setUrl(e.target.value)}
              onKeyDown=${(e) => e.key === "Enter" && handleSubmit()}
              placeholder="https://example.com/article"
              className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
              spellCheck="false"
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="url"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick=${handleSubmit}
              disabled=${loading || !url.trim()}
              className=${[
                "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white transition",
                loading || !url.trim() ? "bg-sky-400 cursor-not-allowed" : theme.button
              ].join(" ")}
            >
              ${loading
                ? html`<svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Analyzing…`
                : "Submit"}
            </button>

            <button
              type="button"
              onClick=${handleClear}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear
            </button>

            ${result?.submissionId && html`
              <button
                type="button"
                onClick=${handleSave}
                disabled=${saving || result.saved}
                className=${[
                  "rounded-xl px-4 py-3 text-sm font-medium transition",
                  result.saved
                    ? "bg-emerald-100 text-emerald-700 cursor-default"
                    : saving
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                ].join(" ")}
              >
                ${result.saved ? "Saved" : saving ? "Saving..." : "Save"}
              </button>
            `}
          </div>

          ${saveMessage && html`
            <div className="text-sm text-slate-600">${saveMessage}</div>
          `}
        </div>
      <//>

      <${ResultsCard} loading=${loading} result=${result} error=${error} />
    </div>
  `;
}

// ── Text tab — new paste-text mode ───────────────────────────────────────────
function TextTab() {
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isReady = text.trim().length >= 100;

  const handleSubmit = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const body = { text: text.trim() };
      if (sourceUrl.trim()) body.sourceUrl = sourceUrl.trim();

      const data = await apiFetch("/api/analyze-text", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(data);
    } catch (err) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [text, sourceUrl, isReady]);

  const handleClear = useCallback(() => {
    setText("");
    setSourceUrl("");
    setResult(null);
    setError(null);
  }, []);

  return html`
    <div className="space-y-7">
      <${Card}>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Analyze article text
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Copy and paste the full article text below. Optionally include the source URL
          to improve domain-based scoring.
        </p>

        <div className="space-y-4 mt-4">

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Source URL <span className="font-normal text-slate-400">(optional — improves domain scoring)</span>
            </label>
            <div className=${"flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                value=${sourceUrl}
                onInput=${(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none"
                spellCheck="false"
                autoCapitalize="off"
                autoCorrect="off"
                inputMode="url"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Article text <span className="text-slate-400">(minimum 100 characters)</span>
            </label>
            <div className=${"rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <textarea
                value=${text}
                onInput=${(e) => setText(e.target.value)}
                placeholder="Paste the full article text here…"
                rows="12"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none resize-y rounded-xl"
                spellCheck="true"
              />
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
              <span>${wordCount} word${wordCount !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>${charCount} char${charCount !== 1 ? "s" : ""}</span>
              ${!isReady && charCount > 0 && html`
                <span className="text-amber-500">Need at least 100 characters</span>
              `}
              ${isReady && html`
                <span className="text-emerald-500">✓ Ready to analyze</span>
              `}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick=${handleSubmit}
              disabled=${loading || !isReady}
              className=${[
                "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white transition",
                loading || !isReady ? "bg-sky-400 cursor-not-allowed" : theme.button
              ].join(" ")}
            >
              ${loading
                ? html`<svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Analyzing…`
                : "Analyze Text"}
            </button>

            <button
              type="button"
              onClick=${handleClear}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 leading-relaxed">
            <span className="font-medium text-slate-600">ℹ Note:</span> Text-only analysis cannot verify the original source.
            Domain scoring will be skipped unless you provide a source URL above.
          </div>
        </div>
      <//>

      <${ResultsCard} loading=${loading} result=${result} error=${error} />
    </div>
  `;
}

// ── Main Analyze page ─────────────────────────────────────────────────────────
export default function Analyze() {
  const [activeTab, setActiveTab] = useState("url");

  const tabs = [
    { id: "url",  label: "🔗 Analyze URL" },
    { id: "text", label: "📋 Paste Text"  },
  ];

  return html`
    <div className="space-y-6">

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        ${tabs.map(tab => html`
          <button
            key=${tab.id}
            type="button"
            onClick=${() => setActiveTab(tab.id)}
            className=${[
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            ].join(" ")}
          >
            ${tab.label}
          </button>
        `)}
      </div>

      ${activeTab === "url"
        ? html`<${UrlTab} />`
        : html`<${TextTab} />`
      }

    </div>
  `;
}