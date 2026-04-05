// popup.js — all logic for the extension popup

const API_BASE = "https://cs-411w-team-blue-misinformation-project-production.up.railway.app";

// ── Storage helpers ───────────────────────────────────────────────────────────
async function getToken() {
  const { ext_token } = await chrome.storage.local.get("ext_token");
  return ext_token || null;
}

async function setToken(token) {
  await chrome.storage.local.set({ ext_token: token });
}

async function clearToken() {
  await chrome.storage.local.remove("ext_token");
}

async function getUser() {
  const { ext_user } = await chrome.storage.local.get("ext_user");
  return ext_user || null;
}

async function setUser(user) {
  await chrome.storage.local.set({ ext_user: user });
}

async function clearUser() {
  await chrome.storage.local.remove("ext_user");
}

// ── API ───────────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", "Bearer " + token);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const viewAnalyze   = $("view-analyze");
const viewLogin     = $("view-login");

const articleBanner = $("article-banner");
const bannerText    = $("banner-text");

const currentPageCard = $("current-page-card");
const notArticleCard  = $("not-article-card");
const loadingState    = $("loading-state");
const resultsView     = $("results-view");
const errorState      = $("error-state");
const errorMsg        = $("error-msg");

const analyzeCurrentBtn = $("analyze-current-btn");
const analyzeAgainBtn   = $("analyze-again-btn");
const retryBtn          = $("retry-btn");

const loginBtn          = $("login-btn");
const logoutBtn         = $("logout-btn");
const loginSubmitBtn    = $("login-submit-btn");
const loginBackBtn      = $("login-back-btn");
const loginEmail        = $("login-email");
const loginPassword     = $("login-password");
const loginError        = $("login-error");
const headerSub         = $("header-sub");

const scoreNumber   = $("score-number");
const ringFill      = $("ring-fill");
const scoreBadge    = $("score-badge");
const scoreDomain   = $("score-domain");
const scoreDate     = $("score-date");
const warningsWrap  = $("warnings-wrap");
const reasonsList   = $("reasons-list");

// ── State ─────────────────────────────────────────────────────────────────────
let currentTab = null;
let currentMeta = null;
let lastResult = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function showOnly(...elements) {
  [currentPageCard, notArticleCard, loadingState, resultsView, errorState].forEach(el => el.classList.add("hidden"));
  elements.forEach(el => el.classList.remove("hidden"));
}

function showView(view) {
  [viewAnalyze, viewLogin].forEach(v => v.classList.add("hidden"));
  view.classList.remove("hidden");
}

function scoreClass(score) {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  if (score >= 25) return "low";
  return "vlow";
}

function scoreLabel(score) {
  if (score >= 75) return "High Credibility";
  if (score >= 50) return "Moderate Credibility";
  if (score >= 25) return "Low Credibility";
  return "Very Low Credibility";
}

function scoreColor(score) {
  if (score >= 75) return "#34d399";
  if (score >= 50) return "#fbbf24";
  if (score >= 25) return "#fb923c";
  return "#f87171";
}

function animateScore(score) {
  const circumference = 213.6;
  const offset = circumference - (score / 100) * circumference;
  ringFill.style.strokeDashoffset = offset;
  ringFill.style.stroke = scoreColor(score);

  // Animate number
  let current = 0;
  const step = Math.ceil(score / 30);
  const interval = setInterval(() => {
    current = Math.min(current + step, score);
    scoreNumber.textContent = current;
    if (current >= score) clearInterval(interval);
  }, 20);
}

function reasonDotClass(reason) {
  const r = reason.toLowerCase();
  if (r.includes("serious flag")) return "flag-serious";
  if (r.includes("moderate flag")) return "flag-moderate";
  if (r.includes("minor flag")) return "flag-minor";
  return "flag-good";
}

function renderResults(result) {
  lastResult = result;

  // Score
  animateScore(result.score);
  const cls = scoreClass(result.score);
  scoreBadge.textContent = scoreLabel(result.score);
  scoreBadge.className = `score-badge ${cls}`;
  scoreDomain.textContent = result.metadata?.domain || "—";
  scoreDate.textContent = result.metadata?.published
    ? `Published: ${new Date(result.metadata.published).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "";

  // Warnings
  warningsWrap.innerHTML = "";
  if (result.contentBlocked) {
    warningsWrap.innerHTML += `
      <div class="warning-card blocked">
        <span class="warning-icon">⚠</span>
        <span>Content retrieval blocked — score based on domain and date only.</span>
      </div>`;
  }
  if (result.biasWarning) {
    warningsWrap.innerHTML += `
      <div class="warning-card bias">
        <span class="warning-icon">🛡</span>
        <span>${result.biasWarning}</span>
      </div>`;
  }
  if (result.aiWarning) {
    warningsWrap.innerHTML += `
      <div class="warning-card ai">
        <span class="warning-icon">🤖</span>
        <span>${result.aiWarning}</span>
      </div>`;
  }

  // Reasons
  reasonsList.innerHTML = (result.reasons || []).map(r => `
    <li>
      <span class="reason-dot ${reasonDotClass(r)}"></span>
      <span>${r}</span>
    </li>
  `).join("");

  showOnly(resultsView);
}

function showError(msg) {
  errorMsg.textContent = msg || "Something went wrong. Please try again.";
  showOnly(errorState);
}

// ── Page detection ────────────────────────────────────────────────────────────
async function detectCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // Try to get metadata from content script
    let meta = null;
    try {
      meta = await chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_META" });
    } catch {
      // Content script not ready or tab isn't injectable (chrome://, etc.)
    }

    currentMeta = meta;

    const url = tab.url || "";
    const isChromePage = url.startsWith("chrome://") || url.startsWith("about:") || url.startsWith("chrome-extension://");

    if (isChromePage) {
      articleBanner.classList.add("hidden");
      showOnly(notArticleCard);
      return;
    }

    const isArticle = meta?.isArticle ?? false;
    const title = meta?.title || tab.title || url;
    const shortUrl = (() => {
      try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
    })();

    if (isArticle) {
      articleBanner.classList.remove("hidden");
      bannerText.textContent = "News article detected — ready to analyze";
    } else {
      articleBanner.classList.add("hidden");
    }

    $("page-title").textContent = title.length > 80 ? title.slice(0, 77) + "…" : title;
    $("page-url").textContent = shortUrl;
    showOnly(currentPageCard);

  } catch (err) {
    showOnly(notArticleCard);
  }
}

// ── Analyze ───────────────────────────────────────────────────────────────────
async function analyze(url) {
  showOnly(loadingState);

  try {
    const token = await getToken();
    let result;

    if (token) {
      // Logged in: use /api/submit to store in DB
      result = await apiFetch("/api/submit", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
    } else {
      // Not logged in: use the public /analyze endpoint
      const res = await fetch(`${API_BASE}/analyze?link=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      result = await res.json();
    }

    renderResults(result);
  } catch (err) {
    showError(err.message);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function updateAuthUI() {
  const user = await getUser();
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "";
    headerSub.textContent = user.email;
  } else {
    loginBtn.style.display = "";
    logoutBtn.style.display = "none";
    headerSub.textContent = "CS 411W · Team Blue";
  }
}

async function handleLogin() {
  const email = loginEmail.value.trim().toLowerCase();
  const password = loginPassword.value;
  loginError.classList.add("hidden");

  if (!email || !password) {
    loginError.textContent = "Email and password are required.";
    loginError.classList.remove("hidden");
    return;
  }

  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = "Signing in…";

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed.");
    if (!data.token) throw new Error("No token returned.");

    await setToken(data.token);

    // Fetch user profile
    const me = await apiFetch("/api/me");
    await setUser({ id: me.id ?? me.user_id, email: me.email, role: me.role });

    loginEmail.value = "";
    loginPassword.value = "";
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = "Sign in";

    await updateAuthUI();
    showView(viewAnalyze);
    await detectCurrentPage();

  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove("hidden");
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = "Sign in";
  }
}

async function handleLogout() {
  await clearToken();
  await clearUser();
  await updateAuthUI();
}

// ── Event listeners ───────────────────────────────────────────────────────────
analyzeCurrentBtn.addEventListener("click", () => {
  if (currentTab?.url) analyze(currentTab.url);
});

analyzeAgainBtn.addEventListener("click", async () => {
  showOnly(currentPageCard);
  await detectCurrentPage();
});

retryBtn.addEventListener("click", () => {
  if (currentTab?.url) analyze(currentTab.url);
});

loginBtn.addEventListener("click", () => {
  showView(viewLogin);
  loginEmail.focus();
});

logoutBtn.addEventListener("click", handleLogout);

loginSubmitBtn.addEventListener("click", handleLogin);
loginBackBtn.addEventListener("click", () => {
  showView(viewAnalyze);
});

loginEmail.addEventListener("keydown", (e) => { if (e.key === "Enter") loginPassword.focus(); });
loginPassword.addEventListener("keydown", (e) => { if (e.key === "Enter") handleLogin(); });

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  await updateAuthUI();
  showView(viewAnalyze);
  await detectCurrentPage();
})();
