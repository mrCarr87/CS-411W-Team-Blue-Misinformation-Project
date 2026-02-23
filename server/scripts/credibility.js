// ─── server/scripts/credibility.js ──────────────────────────────────────────
import { extract } from "@extractus/article-extractor";
import striptags from "striptags";
import fetch from "node-fetch";

const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const HF_URL   = "https://router.huggingface.co/v1/chat/completions";

// ── Well-known domains — never penalised ─────────────────────────────────────
const TRUSTED_DOMAINS = new Set([
  "cnn.com","bbc.com","bbc.co.uk","reuters.com","apnews.com","nytimes.com",
  "washingtonpost.com","theguardian.com","npr.org","pbs.org","nbcnews.com",
  "abcnews.go.com","cbsnews.com","foxnews.com","usatoday.com","wsj.com",
  "politico.com","thehill.com","axios.com","bloomberg.com","forbes.com",
  "time.com","newsweek.com","vice.com","theatlantic.com","newyorker.com",
  "economist.com","ft.com","latimes.com","chicagotribune.com","nypost.com",
  "scientificamerican.com","nature.com","science.org","nih.gov","cdc.gov",
  "who.int","nasa.gov",
]);

const DISINFO_DOMAINS = new Set([
  "infowars.com","naturalcNews.com","breitbart.com","beforeitsnews.com",
  "worldnewsdailyreport.com","empirenews.net","theonion.com","clickhole.com",
  "cnn-trending.com", 
]);

// ── helpers ───────────────────────────────────────────────────────────────────

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function isTrusted(domain) {
  if (TRUSTED_DOMAINS.has(domain)) return true;
  // catch .gov and .edu
  if (domain.endsWith(".gov") || domain.endsWith(".edu")) return true;
  return false;
}

function isDisinfo(domain) {
  return DISINFO_DOMAINS.has(domain);
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
    return text.slice(0, 1000);
  } catch { return null; }
}

// ── AI prompt — only asks for judgment calls, NOT a score ────────────────────
function buildPrompt({ domain, published, contentSnippet, contentAvailable, trusted, disinfo }) {
  const contentSection = contentAvailable
    ? `CONTENT PREVIEW:\n${contentSnippet}`
    : `CONTENT PREVIEW:\n(Content could not be retrieved — do NOT comment on content quality, bias, or tone.)`;

  return `You are a media-literacy expert. Analyze this source and return ONLY a JSON object with your findings. Do NOT calculate a score — just answer each question accurately.

SOURCE:
  Domain    : ${domain}
  Published : ${published ?? "unknown"}
  Trusted   : ${trusted ? "YES — this is a well-known outlet, do not question its reputation" : "NO"}
  Disinfo   : ${disinfo ? "YES — known misinformation or satire site" : "NO"}

${contentSection}

Answer each field honestly:
- "domainTier": one of "trusted", "recognizable", "unknown", "disinfo"
  * "trusted" = major well-known outlet (already marked above)
  * "recognizable" = smaller but legitimate outlet (local news, niche publication)
  * "unknown" = no clear reputation
  * "disinfo" = known for misinformation or satire
- "hasDate": true if a publication date is present, false if not
- "dateOld": true if the date is over 2 years old, false otherwise (false if no date)
- "contentQuality": one of "factual", "biased", "opinion", "sensational", "conspiracy", "blocked"
  * "factual"    = neutral, fact-based reporting with no clear agenda
  * "biased"     = has a detectable political lean or agenda but is still reporting real facts (e.g. left/right-leaning outlets)
  * "opinion"    = clearly an opinion piece, editorial, or commentary
  * "sensational"= uses fear-mongering, emotionally manipulative framing, or clickbait
  * "conspiracy" = unverified claims, conspiracy language, or speculation presented as fact
  * ONLY use "blocked" if content was not retrieved
  * ONLY evaluate content you actually read — never guess
- "biasDirection": one of "left", "right", "none" — only fill this if contentQuality is "biased", otherwise use "none"
- "domainReason": one sentence describing the domain's reputation (positive if trusted/recognizable, negative if unknown/disinfo)
- "contentReason": one sentence about content quality. If blocked, say exactly: "Article content could not be retrieved — score based on domain only."

Respond with ONLY this JSON, no markdown, no extra text:
{
  "domainTier": "...",
  "hasDate": true,
  "dateOld": false,
  "contentQuality": "...",
  "domainReason": "...",
  "contentReason": "...",
  "biasDirection": "none"
}`;
}

// ── Score calculator — deterministic, based on AI's findings ─────────────────
function calculateScore(findings) {
  let score = 100;
  const reasons = [];

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

  // Publication date
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

  return { score: Math.min(100, Math.max(0, score)), reasons, biasWarning };
}

// ── core function ─────────────────────────────────────────────────────────────

export async function analyzeCredibility(url) {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!url) throw new Error("No URL provided");

  // 1. Extract article content
  let published, contentSnippet, contentAvailable;
  try {
    const data = await extract(url);
    published = data?.published;
    const raw = striptags(data?.content ?? "").trim();
    if (raw.length > 50) {
      contentSnippet   = raw.slice(0, 1000);
      contentAvailable = true;
    } else {
      throw new Error("Empty content");
    }
  } catch {
    const fallback = await fetchContentFallback(url);
    // Require at least 1500 chars — nav/footer HTML shells are usually under this
    if (fallback && fallback.length > 1500) {
      contentSnippet   = fallback;
      contentAvailable = true;
    } else {
      contentSnippet   = "";
      contentAvailable = false;
    }
  }

  const domain  = extractDomain(url);
  const trusted = isTrusted(domain);
  const disinfo = isDisinfo(domain);

  // 2. Call Hugging Face — only for judgment calls
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
      max_tokens: 300,
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

  // Force trusted/disinfo if our code already knows — don't let model override
  if (trusted)  findings.domainTier = "trusted";
  if (disinfo)  findings.domainTier = "disinfo";
  if (!contentAvailable) findings.contentQuality = "blocked";

  // 3. Calculate score in code — deterministic
  const { score, reasons, biasWarning } = calculateScore(findings);

  return {
    score,
    reasons,
    biasWarning:    biasWarning ?? null,
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