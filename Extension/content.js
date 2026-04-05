// content.js — injected into every page
// Detects if the page looks like a news article and sends metadata to popup

(function () {
  function getPageMeta() {
    const getMeta = (name) =>
      document.querySelector(`meta[property="${name}"]`)?.content ||
      document.querySelector(`meta[name="${name}"]`)?.content ||
      null;

    const isArticle =
      getMeta("og:type") === "article" ||
      !!document.querySelector("article") ||
      !!document.querySelector('[itemtype*="Article"]') ||
      !!document.querySelector('[itemtype*="NewsArticle"]');

    return {
      url: window.location.href,
      title:
        getMeta("og:title") ||
        document.querySelector("h1")?.innerText?.trim() ||
        document.title,
      isArticle,
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "GET_PAGE_META") {
      sendResponse(getPageMeta());
    }
  });
})();
