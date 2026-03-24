// ─── server/scripts/credibility.js ──────────────────────────────────────────
import "dotenv/config";
import { extract } from "@extractus/article-extractor";
import striptags from "striptags";
import fetch from "node-fetch";
import { DISINFO_SET, TRUSTED_SET } from "../config/domain.js"; // Links stored db domains 

const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const HF_URL   = "https://router.huggingface.co/v1/chat/completions";

// AI-generated text detection model
const AI_DETECTOR_MODEL = "roberta-base-openai-detector";


// ── Well-known domains — never penalised ─────────────────────────────────────
const TRUSTED_DOMAINS = new Set(TRUSTED_SET);
const DISINFO_DOMAINS = new Set(DISINFO_SET);

// ── helpers ───────────────────────────────────────────────────────────────────

const HF_TOKEN = process.env.HF_TOKEN;

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

// ScraperAPI fetcher — bypasses blocks on sites
async function fetchWithScraperAPI(url) {
  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
  if (!SCRAPER_API_KEY) return null; // skip if no key

  try {
    const apiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { timeout: 15000 });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Remove script and style tags WITH their content
    const cleanedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    const text = striptags(cleanedHtml).replace(/\s+/g, " ").trim();
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

// ── AI-Generated Text Detection ──────────────────────────────────────────────
async function detectAIGenerated(text) {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!text || text.length < 100) return null; // Need sufficient text

  try {
    // Split text into chunks (model has 512 token limit)
    const chunks = [];
    const words = text.split(' ');
    const chunkSize = 400; // ~400 words per chunk to stay under token limit
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    // Analyze up to 3 chunks (beginning, middle, end)
    const samplesToAnalyze = [];
    if (chunks.length === 1) {
      samplesToAnalyze.push(chunks[0]);
    } else if (chunks.length === 2) {
      samplesToAnalyze.push(chunks[0], chunks[1]);
    } else {
      samplesToAnalyze.push(
        chunks[0], // beginning
        chunks[Math.floor(chunks.length / 2)], // middle
        chunks[chunks.length - 1] // end
      );
    }

    const results = [];
    
    for (const sample of samplesToAnalyze) {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${AI_DETECTOR_MODEL}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: sample }),
        }
      );

      if (!response.ok) continue; // Skip failed chunks
      
      const data = await response.json();
      
      // Model returns array like: [[{label: "Human", score: 0.8}, {label: "ChatGPT", score: 0.2}]]
      if (data && data[0]) {
        const aiLabel = data[0].find(item => 
          item.label.toLowerCase().includes('chatgpt') || 
          item.label.toLowerCase().includes('ai') ||
          item.label.toLowerCase().includes('generated')
        );
        
        if (aiLabel) {
          results.push(aiLabel.score);
        }
      }
    }

    if (results.length === 0) return null;

    // Average the scores
    const avgScore = results.reduce((a, b) => a + b, 0) / results.length;
    const percentage = Math.round(avgScore * 100);

    // Debug logging
    console.log("🤖 AI Detection Results:");
    console.log("  Raw scores:", results);
    console.log("  Average:", avgScore);
    console.log("  Percentage:", percentage);

    return {
      probability: percentage,
      confidence: results.length >= 2 ? "high" : "medium",
      samplesAnalyzed: results.length
    };

  } catch (error) {
    console.error("AI detection error:", error);
    return null;
  }
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
  Trusted   : ${trusted ? "YES — established outlet with generally reliable reporting" : "NO"}
  Disinfo: ${disinfo ? "YES — known misinformation or satire site" : "NO"}


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
  * Evaluate the CONTENT ITSELF independently of the domain reputation.
  A trusted outlet can still publish biased or opinion content. Be honest about what 
  you see in the text — if it has a clear political lean, mark it "biased" even if 
  the source is well-known.
- "biasDirection": one of "left", "right", "none" (only fill if contentQuality is "biased")
- "domainReason": one sentence describing domain reputation
- "contentReason": one sentence about content quality (if blocked, say "Article content could not be retrieved")

${contentAvailable ? `
TEXT ANALYSIS (only if content WAS retrieved):
- "claimsVsOpinion": Percentage estimate — what % is verifiable factual claims vs opinion/commentary? 
  Pure news reporting should be 80-90% claims. Only mark as opinion if the author is clearly 
  expressing personal views, not just reporting facts. Return as {"claims": 70, "opinion": 30}- "factVsSpeculation": Does article distinguish facts from speculation? "clear", "mixed", or "poor"
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
function calculateScore(findings, aiDetection) {
  let score = 100;
  const reasons = [];
  const analysis = {};

  // ── Domain ────────────────────────────────────────────────────────────────
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

  // ── Date ──────────────────────────────────────────────────────────────────
  if (!findings.hasDate) {
    score -= 8;
    reasons.push("Minor flag: No publication date was found on this article.");
  } else if (findings.dateOld) {
    score -= 3;
    reasons.push("Minor flag: The publication date is over two years old.");
  } else {
    reasons.push("Publication date is present and recent.");
  }

  // ── AI-Generated Detection ────────────────────────────────────────────────
  let aiWarning = null;
  if (aiDetection && aiDetection.probability >= 50) {
    if (aiDetection.probability >= 80) {
      score -= 25;
      reasons.push(`Serious flag: Content appears to be AI-generated (${aiDetection.probability}% probability).`);
      aiWarning = `This article is highly likely (${aiDetection.probability}%) to be AI-generated. Verify claims independently.`;
    } else if (aiDetection.probability >= 65) {
      score -= 15;
      reasons.push(`Moderate flag: Content may be partially AI-generated (${aiDetection.probability}% probability).`);
      aiWarning = `This article shows signs of AI-generated content (${aiDetection.probability}% probability). Cross-check important claims.`;
    } else {
      score -= 8;
      reasons.push(`Minor flag: Some AI-generated patterns detected (${aiDetection.probability}% probability).`);
    }
  }

  // ── Content Quality ───────────────────────────────────────────────────────
  let biasWarning = null;
  switch (findings.contentQuality) {
    case "factual":
      reasons.push("Content appears factual and neutral with no misleading signals.");
      break;
    case "biased": {
      score -= 20;
      const direction = findings.biasDirection !== "none" ? ` (${findings.biasDirection}-leaning)` : "";
      reasons.push(`Moderate flag: ${findings.contentReason}`);
      biasWarning = `This article shows signs of political bias${direction}. Consider cross-referencing with other sources.`;
      break;
    }
    case "opinion":
      score -= 25;
      reasons.push(`Moderate flag: ${findings.contentReason}`);
      biasWarning = "This is an opinion or editorial piece. The views expressed reflect the author's perspective.";
      break;
    case "sensational":
      score -= 25;
      reasons.push(`Moderate flag: ${findings.contentReason}`);
      break;
    case "conspiracy":
      score -= 35;
      reasons.push(`Serious flag: ${findings.contentReason}`);
      break;
    case "blocked":
      score -= 5;
      reasons.push("Minor flag: Article content could not be retrieved — score is based on domain and date only.");
      break;
  }

  // ── claimsVsOpinion penalty ───────────────────────────────────────────────
  if (findings.claimsVsOpinion) {
    analysis.claimsVsOpinion = findings.claimsVsOpinion;
    const opinionPct = findings.claimsVsOpinion.opinion ?? 0;
    if (opinionPct >= 50) {
      score -= 10;
      reasons.push(`Moderate flag: ${opinionPct}% of content is opinion or editorial framing.`);
    } else if (opinionPct >= 25) {
      score -= 5;
      reasons.push(`Minor flag: ${opinionPct}% of content contains opinion or editorial framing.`);
    }
  }

  // ── factVsSpeculation penalty ─────────────────────────────────────────────
  if (findings.factVsSpeculation) {
    analysis.factVsSpeculation = findings.factVsSpeculation;
    if (findings.factVsSpeculation === "poor") {
      score -= 10;
      reasons.push("Moderate flag: Article poorly distinguishes facts from speculation.");
    } else if (findings.factVsSpeculation === "mixed") {
      score -= 4;
      reasons.push("Minor flag: Article mixes facts and speculation without clear distinction.");
    }
  }

  // ── sourceCitations penalty ───────────────────────────────────────────────
  if (findings.sourceCitations) {
    analysis.sourceCitations = findings.sourceCitations;
    if (findings.sourceCitations === "none") {
      score -= 5;
      reasons.push("Minor flag: Article does not cite sources for its claims.");
    } else if (findings.sourceCitations === "weak") {
      score -= 2;
      reasons.push("Minor flag: Article relies on vague or anonymous sources.");
    }
  }

  if (findings.exampleClaim) analysis.exampleClaim = findings.exampleClaim;
  if (findings.exampleOpinion && findings.exampleOpinion !== "none") analysis.exampleOpinion = findings.exampleOpinion;
  if (aiDetection) analysis.aiGenerated = aiDetection;

  // ── AI keyword check in contentReason ────────────────────────────────────
  if (!aiWarning && findings.contentReason) {
    const aiKeywords = ['ai-written', 'ai-generated', 'written by ai', 'generated by ai', 'artificial intelligence wrote', 'chatgpt'];
    if (aiKeywords.some(k => findings.contentReason.toLowerCase().includes(k))) {
      score -= 20;
      aiWarning = "The content analysis detected this article was written by AI.";
      reasons.push("Serious flag: Article appears to be AI-generated based on content analysis.");
    }
  }

  return { score: Math.min(100, Math.max(0, score)), reasons, biasWarning, aiWarning, analysis };
}

// ── core function ─────────────────────────────────────────────────────────────

export async function analyzeCredibility(url) {
  if (!url) throw new Error("No URL provided");

  // 1. Extract article content — try article-extractor first, then ScraperAPI, then fallback
  let published, contentSnippet, contentAvailable, fullText, articleTitle;

  try {
    const data = await extract(url);
    articleTitle = data?.title ?? null; // ADD THIS
    published = data?.published;
    const raw = striptags(data?.content ?? "").trim();
    if (raw.length > 50) {
      fullText         = raw;
      contentSnippet   = raw.slice(0, 2000);
      contentAvailable = true;
      console.log("Content snippet length:", contentSnippet.length);
      console.log("First 200 chars:", contentSnippet.slice(0, 200));
    } else {
      throw new Error("Empty content");
    }
  } catch {
    // Try ScraperAPI first (bypasses blocks)
    const scraped = await fetchWithScraperAPI(url);
    if (scraped) {
      fullText         = scraped;
      contentSnippet   = scraped;
      contentAvailable = true;
      console.log("✅ ScraperAPI worked");
      console.log("First 200 chars:", contentSnippet.slice(0, 200));
    } else {
      // Fall back to direct fetch
      const fallback = await fetchContentFallback(url);
      if (fallback) {
        fullText         = fallback;
        contentSnippet   = fallback;
        contentAvailable = true;
        console.log("✅ Fallback fetch worked");
        console.log("First 200 chars:", contentSnippet.slice(0, 200));
      } else {
        fullText         = "";
        contentSnippet   = "";
        contentAvailable = false;
        console.log("❌ All content extraction methods failed");
      }
    }

  }

  async function checkRedditTrending(headline) {
    if (!headline) return null;
  
    try {
      const query = encodeURIComponent(headline.slice(0, 100));
      console.log("🔴 Reddit query:", query); // debug log goes HERE
      const res = await fetch(
        `https://www.reddit.com/search.json?q=${query}&sort=new&limit=10&t=week`,
        {
          headers: { "User-Agent": "misinformation-detector/1.0" }
        }
      );
  
      if (!res.ok) return null;
      const data = await res.json();
      const posts = data?.data?.children ?? [];
  
      console.log("🔴 Reddit posts found:", posts.length); // debug log goes HERE
      if (posts.length > 0) {
        console.log("🔴 Top post score:", posts[0].data.score);
        console.log("🔴 Top post comments:", posts[0].data.num_comments);
        console.log("🔴 Top post created:", new Date(posts[0].data.created_utc * 1000).toISOString());
      }
  
      if (posts.length === 0) return null;
  
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - 24 * 60 * 60;
  
      const recentPosts = posts.filter(p => p.data.created_utc > twentyFourHoursAgo);
      const highTractionPosts = posts.filter(p => p.data.score > 100 || p.data.num_comments > 50);
  
      if (recentPosts.length === 0 && highTractionPosts.length === 0) return null;
  
      if (recentPosts.length > 0 && highTractionPosts.length > 0) {
        return {
          level: "high",
          message: `This topic is actively trending on Reddit with ${highTractionPosts.length} high-engagement post(s) in the last 24 hours. Information may be rapidly evolving — verify with multiple sources before sharing.`
        };
      } else if (recentPosts.length > 0) {
        return {
          level: "medium",
          message: `This topic has appeared on Reddit recently. Information may still be developing — check back for updates.`
        };
      } else {
        return {
          level: "medium",
          message: `This topic is generating discussion on Reddit. Cross-reference with other sources for a complete picture.`
        };
      }
  
    } catch (err) {
      console.error("Reddit check failed:", err);
      return null;
    }
  }

  const domain  = extractDomain(url);
  const trusted = isTrusted(domain);
  const disinfo = isDisinfo(domain);

  // 2. Detect AI-generated content (parallel with content analysis)
  const aiDetectionPromise = contentAvailable ? detectAIGenerated(fullText) : Promise.resolve(null);
  const redditPromise = checkRedditTrending(articleTitle ?? domain);
  // 3. Call Hugging Face — judgment calls + text analysis

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
    throw new Error(`Hugging Face API error ${response.status}: ${errText.error}`);
  }

  const hfData  = await response.json();
  const raw     = hfData?.choices?.[0]?.message?.content ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Model did not return valid JSON. Try again.");

  const findings = JSON.parse(jsonMatch[0]);
  

  // Force trusted/disinfo if our code knows
  if (trusted && findings.domainTier !== "disinfo") findings.domainTier = "trusted";
  if (disinfo)  findings.domainTier = "disinfo";
  if (!contentAvailable) findings.contentQuality = "blocked";

  // Wait for AI detection to complete
  const [aiDetection, redditTrending] = await Promise.all([
    aiDetectionPromise,
    redditPromise,
  ]);

  // 4. Calculate score in code
  const { score, reasons, biasWarning, aiWarning, analysis } = calculateScore(findings, aiDetection);

  return {
    score,
    reasons,
    biasWarning:    biasWarning ?? null,
    aiWarning:      aiWarning ?? null,
    redditTrending: redditTrending ?? null,
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