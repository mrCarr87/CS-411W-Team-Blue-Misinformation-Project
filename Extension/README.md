# Misinformation Detector — Chrome Extension

A Chrome extension for CS 411W Team Blue that lets you analyze the credibility of any news article directly from your browser.

---

## Features

- **One-click analysis** — click the extension icon on any news article to instantly analyze it
- **Auto-detection** — the extension badge lights up (!) when you're on a page that looks like a news article
- **Full credibility report** — see the score, bias warnings, AI-detection results, and the reasoning behind the score
- **Optional login** — sign in with your account to have analyses saved to your dashboard automatically

---

## How to Install (Developer Mode)

Chrome extensions that aren't on the Chrome Web Store must be loaded in developer mode.

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** on (top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project
5. The **MD** icon will appear in your Chrome toolbar

> Tip: Pin the extension by clicking the puzzle piece icon in Chrome's toolbar, then clicking the pin next to "Misinformation Detector".

---

## How to Use

1. Navigate to any news article
2. The extension badge will show a blue **!** if an article is detected
3. Click the extension icon — you'll see the article title and URL
4. Click **Analyze This Page** — results appear in the popup within a few seconds
5. Expand **"Why this score?"** to see the detailed reasoning

### Logging in (optional)
- Click the person icon (top-right of the popup) to sign in
- Use the same credentials as the main web app
- When logged in, analyses are saved to your dashboard automatically

---

## File Structure

```
extension/
├── manifest.json       ← Extension config (Manifest V3)
├── background.js       ← Service worker: badge detection logic
├── content.js          ← Injected into pages: reads article metadata
├── popup.html          ← Popup UI
├── popup.css           ← Popup styles
├── popup.js            ← Popup logic (analyze, auth, render)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## How it Works

| Logged out | Logged in |
|---|---|
| Uses the public `GET /analyze?link=…` endpoint | Uses `POST /api/submit` to store analysis in DB |
| Results shown in popup only | Results saved to your dashboard |

The extension communicates with the same Railway-deployed backend as the web app.

---

## Notes

- The extension uses **Manifest V3** (required by Chrome as of 2024)
- Auth tokens are stored in `chrome.storage.local` (scoped to the extension only)
- The content script runs on all URLs but only reads metadata — it never modifies the page
