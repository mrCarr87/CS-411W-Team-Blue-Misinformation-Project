// background.js — service worker
// Listens for tab updates and badges the icon when on a news/article page

const ARTICLE_PATTERNS = [
  /\/article\//i,
  /\/news\//i,
  /\/story\//i,
  /\/post\//i,
  /\/blog\//i,
  /\/opinion\//i,
  /\/politics\//i,
  /\/world\//i,
  /\/health\//i,
  /\/science\//i,
  /\/technology\//i,
  /\/sports\//i,
  /\/entertainment\//i,
  /\d{4}\/\d{2}\/\d{2}/,   // date-based URLs like /2024/01/15/
];

const NEWS_DOMAINS = [
  "cnn.com", "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com",
  "nytimes.com", "washingtonpost.com", "theguardian.com", "npr.org",
  "nbcnews.com", "abcnews.go.com", "cbsnews.com", "foxnews.com",
  "usatoday.com", "wsj.com", "politico.com", "thehill.com",
  "axios.com", "bloomberg.com", "forbes.com", "time.com",
  "newsweek.com", "theatlantic.com", "newyorker.com", "economist.com",
  "breitbart.com", "infowars.com", "naturalnews.com", "beforeitsnews.com",
  "nypost.com", "latimes.com", "chicagotribune.com", "vice.com",
];

function isArticlePage(url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("about:")) return false;
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    if (NEWS_DOMAINS.some(d => domain === d || domain.endsWith("." + d))) return true;
    if (ARTICLE_PATTERNS.some(p => p.test(parsed.pathname))) return true;
    return false;
  } catch {
    return false;
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (isArticlePage(tab.url)) {
    chrome.action.setBadgeText({ tabId, text: "!" });
    chrome.action.setBadgeBackgroundColor({ tabId, color: "#0ea5e9" });
    chrome.action.setBadgeTextColor({ tabId, color: "#ffffff" });
  } else {
    chrome.action.setBadgeText({ tabId, text: "" });
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (isArticlePage(tab.url)) {
      chrome.action.setBadgeText({ tabId, text: "!" });
      chrome.action.setBadgeBackgroundColor({ tabId, color: "#0ea5e9" });
      chrome.action.setBadgeTextColor({ tabId, color: "#ffffff" });
    } else {
      chrome.action.setBadgeText({ tabId, text: "" });
    }
  } catch {}
});
