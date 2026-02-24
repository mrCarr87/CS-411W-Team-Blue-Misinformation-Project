// ─── server/scripts/credibility.js ──────────────────────────────────────────
import { extract } from "@extractus/article-extractor";
import striptags from "striptags";
import fetch from "node-fetch";
import { DISINFO_SET, TRUSTED_SET } from "../config/domain.js"; // Links stored db domains 

const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const HF_URL   = "https://router.huggingface.co/v1/chat/completions";

// ── Well-known domains — never penalised ─────────────────────────────────────
const TRUSTED_DOMAINS = new Set(TRUSTED_SET);
const DISINFO_DOMAINS = new Set(DISINFO_SET);

// ── helpers ───────────────────────────────────────────────────────────────────

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return String(url).toLowerCase(); }
}

function isTrusted(domain) {
  if (TRUSTED_DOMAINS.has(domain)) return true;
  if (domain.endsWith(".gov") || domain.endsWith(".edu")) return true;
  return false;
}

function isDisinfo(domain) {
  return DISINFO_DOMAINS.has(domain);
}

// ScraperAPI fetcher — bypasses blocks on sites like CNN
async function fetchWithScraperAPI(url) {
  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
  if (!SCRAPER_API_KEY) return null; // gracefully skip if no key

  try {
    const apiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { timeout: 15000 });
    if (!res.ok) return null;
    const html = await res.text();
    const text = striptags(html).replace(/\s+/g, " ").trim();
    return text.length > 1500 ? text.slice(0, 2000) : null;
  } catch {
    return null;
  }
}

// Fallback fetcher for sites like CNN that block article-extractor
async function fetchContentFallback(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = striptags(html).replace(/\s+/g, " ").trim();
    return text.length > 1500 ? text.slice(0, 2000) : null;
  } catch { return null; }
}

// ── AI prompt — asks for judgment calls + text analysis ──────────────────────
function buildPrompt({ domain, published, contentSnippet, contentAvailable, trusted, disinfo }) {
  const contentSection = contentAvailable
    ? `CONTENT PREVIEW:\n${contentSnippet}`
    : `CONTENT PREVIEW:\n(Content could not be retrieved — do NOT comment on content quality, bias, or tone.)`;

  return `You are a media-literacy expert. Analyze this source and return ONLY a JSON object with your findings.

SOURCE:
  Domain    : ${domain}
  Published : ${published ?? "unknown"}
  Trusted   : ${trusted ? "YES — well-known outlet, do not question reputation" : "NO"}
  Disinfo   : ${disinfo ? "YES — known misinformation or satire site" : "NO"}

${contentSection}

Answer each field:
- "domainTier": one of "trusted", "recognizable", "unknown", "disinfo"
- "hasDate": true if publication date present, false if not
- "dateOld": true if date is over 2 years old, false otherwise
- "contentQuality": one of "factual", "biased", "opinion", "sensational", "conspiracy", "blocked"
  * "factual"    = neutral, fact-based reporting
  * "biased"     = detectable political lean but still reporting real facts
  * "opinion"    = clearly opinion, editorial, or commentary
  * "sensational"= fear-mongering, emotionally manipulative framing
  * "conspiracy" = unverified claims, speculation as fact
  * ONLY use "blocked" if content was NOT retrieved
- "biasDirection": one of "left", "right", "none" (only fill if contentQuality is "biased")
- "domainReason": one sentence describing domain reputation
- "contentReason": one sentence about content quality (if blocked, say "Article content could not be retrieved")

${contentAvailable ? `
TEXT ANALYSIS (only if content WAS retrieved):
- "claimsVsOpinion": Percentage estimate — what % is factual claims vs opinion? Return as {"claims": 70, "opinion": 30}
- "factVsSpeculation": Does article distinguish facts from speculation? "clear", "mixed", or "poor"
- "sourceCitations": Does article cite sources? "strong" (multiple named), "weak" (vague/anonymous), or "none"
- "exampleClaim": Extract ONE specific factual claim (one sentence)
- "exampleOpinion": Extract ONE opinion statement if present (one sentence, or "none" if purely factual)
` : ''}

Respond with ONLY this JSON:
{
  "domainTier": "...",
  "hasDate": true,
  "dateOld": false,
  "contentQuality": "...",
  "domainReason": "...",
  "contentReason": "...",
  "biasDirection": "none"${contentAvailable ? `,
  "claimsVsOpinion": {"claims": 0, "opinion": 0},
  "factVsSpeculation": "...",
  "sourceCitations": "...",
  "exampleClaim": "...",
  "exampleOpinion": "..."` : ''}
}`;
}

// ── Score calculator — deterministic, based on AI's findings ─────────────────
function calculateScore(findings) {
  let score = 100;
  const reasons = [];
  const analysis = {}; // extra details for UI

  // Domain
  switch (findings.domainTier) {
    case "trusted":
      reasons.push(findings.domainReason);
      break;
    case "recognizable":
      score -= 5;
      reasons.push(`Minor flag: ${findings.domainReason}`);
      break;
    case "unknown":
      score -= 20;
      reasons.push(`Serious flag: ${findings.domainReason}`);
      break;
    case "disinfo":
      score -= 60;
      reasons.push(`Serious flag: ${findings.domainReason}`);
      break;
  }

  // Date
  if (!findings.hasDate) {
    score -= 8;
    reasons.push("Minor flag: No publication date was found on this article.");
  } else if (findings.dateOld) {
    score -= 3;
    reasons.push("Minor flag: The publication date is over two years old.");
  } else {
    reasons.push("Publication date is present and recent.");
  }

  // Content quality
  let biasWarning = null;
  switch (findings.contentQuality) {
    case "factual":
      reasons.push("Content appears factual and neutral with no misleading signals.");
      break;
    case "biased":
      score -= 12;
      const direction = findings.biasDirection !== "none" ? ` (${findings.biasDirection}-leaning)` : "";
      reasons.push(`Moderate flag: ${findings.contentReason}`);
      biasWarning = `This article shows signs of political bias${direction}. The credibility score reflects the source's reputation, but the content may present a one-sided perspective. Consider cross-referencing with other sources.`;
      break;
    case "opinion":
      score -= 10;
      reasons.push(`Moderate flag: ${findings.contentReason}`);
      biasWarning = "This appears to be an opinion or editorial piece, not straight news reporting. The views expressed reflect the author's perspective.";
      break;
    case "sensational":
      score -= 20;
      reasons.push(`Moderate flag: ${findings.contentReason}`);
      break;
    case "conspiracy":
      score -= 30;
      reasons.push(`Serious flag: ${findings.contentReason}`);
      break;
    case "blocked":
      score -= 5;
      reasons.push("Minor flag: Article content could not be retrieved — score is based on domain and date only.");
      break;
  }

  // Text analysis (if available)
  if (findings.claimsVsOpinion) {
    analysis.claimsVsOpinion = findings.claimsVsOpinion;
  }
  if (findings.factVsSpeculation) {
    analysis.factVsSpeculation = findings.factVsSpeculation;
  }
  if (findings.sourceCitations) {
    analysis.sourceCitations = findings.sourceCitations;
    if (findings.sourceCitations === "none") {
      score -= 5;
      reasons.push("Minor flag: Article does not cite sources for its claims.");
    }
  }
  if (findings.exampleClaim) {
    analysis.exampleClaim = findings.exampleClaim;
  }
  if (findings.exampleOpinion && findings.exampleOpinion !== "none") {
    analysis.exampleOpinion = findings.exampleOpinion;
  }

  return { score: Math.min(100, Math.max(0, score)), reasons, biasWarning, analysis };
}

// ── core function ─────────────────────────────────────────────────────────────

export async function analyzeCredibility(url) {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!url) throw new Error("No URL provided");

  // 1. Extract article content — try article-extractor first, then ScraperAPI, then fallback
  let published, contentSnippet, contentAvailable;
  try {
    const data = await extract(url);
    published = data?.published;
    const raw = striptags(data?.content ?? "").trim();
    if (raw.length > 50) {
      contentSnippet   = raw.slice(0, 2000);
      contentAvailable = true;
    } else {
      throw new Error("Empty content");
    }
  } catch {
    // Try ScraperAPI first (bypasses blocks)
    const scraped = await fetchWithScraperAPI(url);
    if (scraped) {
      contentSnippet   = scraped;
      contentAvailable = true;
    } else {
      // Fall back to direct fetch
      const fallback = await fetchContentFallback(url);
      if (fallback) {
        contentSnippet   = fallback;
        contentAvailable = true;
      } else {
        contentSnippet   = "";
        contentAvailable = false;
      }
    }
  }

  const domain  = extractDomain(url);
  const trusted = isTrusted(domain);
  const disinfo = isDisinfo(domain);

  // 2. Call Hugging Face — judgment calls + text analysis
  const response = await fetch(HF_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [{
        role: "user",
        content: buildPrompt({ domain, published, contentSnippet, contentAvailable, trusted, disinfo }),
      }],
      max_tokens: contentAvailable ? 600 : 300, // more tokens for text analysis
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Hugging Face API error ${response.status}: ${errText}`);
  }

  const hfData  = await response.json();
  const raw     = hfData?.choices?.[0]?.message?.content ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Model did not return valid JSON. Try again.");

  const findings = JSON.parse(jsonMatch[0]);

  // Force trusted/disinfo if our code knows
  if (trusted)  findings.domainTier = "trusted";
  if (disinfo)  findings.domainTier = "disinfo";
  if (!contentAvailable) findings.contentQuality = "blocked";

  // 3. Calculate score in code
  const { score, reasons, biasWarning, analysis } = calculateScore(findings);

  return {
    score,
    reasons,
    biasWarning:    biasWarning ?? null,
    analysis:       Object.keys(analysis).length > 0 ? analysis : null,
    metadata:       { published, domain },
    contentBlocked: !contentAvailable,
  };
}

// ── Express route handler ─────────────────────────────────────────────────────

export async function analyzeRoute(req, res) {
  const { link } = req.query;
  try {
    const result = await analyzeCredibility(link);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message ?? "Analysis failed" });
  }
}