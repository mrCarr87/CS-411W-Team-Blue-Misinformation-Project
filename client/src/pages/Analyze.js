import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";

const { useState, useCallback } = window.React;
const html = window.htm.bind(window.React.createElement);

// ── Score colour helper ───────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 75) return { text: "text-emerald-600", bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "High Credibility" };
  if (score >= 50) return { text: "text-amber-600",  bar: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 border-amber-200",   label: "Moderate Credibility" };
  if (score >= 25) return { text: "text-orange-600", bar: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200", label: "Low Credibility" };
  return               { text: "text-red-600",    bar: "bg-red-500",    badge: "bg-red-50 text-red-700 border-red-200",       label: "Very Low Credibility" };
}

// ── Score meter ───────────────────────────────────────────────────────────────
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

// ── Text analysis panel ───────────────────────────────────────────────────────
function TextAnalysis({ analysis }) {
  if (!analysis) return null;

  return html`
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">📊 Content Analysis</h3>
      </div>
      <div className="px-4 py-3 space-y-4">
        
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

// ── Reasons accordion ─────────────────────────────────────────────────────────
function ReasonsAccordion({ reasons, metadata }) {
  const [open, setOpen] = useState(false);
  return html`
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick=${() => setOpen(o => !o)}
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
              ${metadata.domain    && html`<span><span className="font-medium text-slate-700">Source:</span> ${metadata.domain}</span>`}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Analyze() {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const handleSubmit = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      // Auto-detect: localhost for dev, Render for production
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
? 'http://localhost:3000' 
: 'https://cs-411w-team-blue-misinformation-project.onrender.com';

const res = await fetch(`${API_URL}/analyze?link=${encodeURIComponent(url.trim())}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleClear = useCallback(() => {
    setUrl(""); setResult(null); setError(null);
  }, []);

  return html`
    <div className="space-y-7">
      <${Card}>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Analyze a link
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Paste an article URL below. AI will evaluate the source's credibility
          based on the publisher, publication date, and content.
        </p>
        <div className="space-y-4 mt-4">
          <div className=${"flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
            <input
              value=${url}
              onInput=${e => setUrl(e.target.value)}
              onKeyDown=${e => e.key === "Enter" && handleSubmit()}
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
              className=${["inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white transition",
                loading || !url.trim() ? "bg-sky-400 cursor-not-allowed" : theme.button].join(" ")}
            >
              ${loading
                ? html`<svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Analyzing…`
                : "Submit"}
            </button>
            <button type="button" onClick=${handleClear}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Clear
            </button>
          </div>
        </div>
      <//>

      <${Card} title=${result ? "Credibility Analysis" : "Results"}>
        ${!result && !error && !loading && html`
          <div className="text-sm text-slate-500">Submit a link above to see an AI credibility analysis here.</div>
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
    </div>
  `;
}