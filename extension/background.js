// Secret Ads — service worker : centralise les appels API (CSP-proof,
// les content scripts passent par ici via messages).

// ⚙️ Adaptez si votre déploiement est sur un autre domaine
const API = "https://secret-ads-real.vercel.app";

function ensureUid(callback) {
  chrome.storage.sync.get("uid", (data) => {
    if (data.uid) {
      callback(data.uid);
      return;
    }
    const uid =
      "usr_ext_" +
      Date.now().toString(36) +
      Math.floor(Math.random() * 1e6).toString(36);
    chrome.storage.sync.set({ uid }, () => callback(uid));
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureUid(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "serveAd") {
    fetch(API + "/api/ads?llm=" + encodeURIComponent(msg.llm || "claude"))
      .then((r) => r.json())
      .then((json) =>
        sendResponse({ ok: true, ad: json && json.ad ? json.ad : null })
      )
      .catch(() => sendResponse({ ok: false, ad: null }));
    return true; // réponse asynchrone
  }
  if (msg && msg.type === "track") {
    ensureUid((uid) => {
      fetch(API + "/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: msg.campaignId,
          event: msg.event,
          uid,
        }),
      }).catch(() => {
        /* best effort */
      });
    });
  }
  return undefined;
});
