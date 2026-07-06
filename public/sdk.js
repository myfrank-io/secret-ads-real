/**
 * Secret Ads SDK — affiche une publicité "loading bar" dans tout conteneur
 * portant l'attribut [data-secret-ads], et trace impression + clics.
 *
 * <div data-secret-ads></div>
 * <script src="https://VOTRE-DOMAINE/sdk.js" data-llm="claude" data-topics="tech" defer></script>
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var origin = (function () {
    try {
      return new URL(script.src).origin;
    } catch (e) {
      return "";
    }
  })();

  var llm = script.getAttribute("data-llm") || "claude";
  var topics = script.getAttribute("data-topics") || "";

  function track(campaignId, event) {
    try {
      fetch(origin + "/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaignId, event: event }),
        keepalive: true,
      });
    } catch (e) {
      /* best effort */
    }
  }

  function render(container, ad) {
    container.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.style.cssText =
      "display:flex;gap:12px;align-items:flex-start;padding:12px 14px;" +
      "border:1px solid rgba(128,128,128,.35);border-radius:10px;" +
      "font-family:system-ui,-apple-system,'Segoe UI',sans-serif;" +
      "font-size:14px;line-height:1.4;max-width:560px;";

    var logo = document.createElement("div");
    logo.style.cssText =
      "width:34px;height:34px;border-radius:9px;flex-shrink:0;color:#fff;" +
      "display:flex;align-items:center;justify-content:center;font-weight:700;" +
      "background:" + (ad.color || "#5b4be0") + ";";
    logo.textContent = (ad.advertiser || "?").charAt(0);

    var content = document.createElement("div");

    var sponsor = document.createElement("div");
    sponsor.style.cssText =
      "font-size:10px;text-transform:uppercase;letter-spacing:.06em;opacity:.6;";
    sponsor.textContent = "Sponsorisé · " + ad.advertiser;

    var headline = document.createElement("div");
    headline.style.cssText = "font-weight:600;margin-top:2px;";
    headline.textContent = ad.headline;

    var body = document.createElement("div");
    body.style.cssText = "font-size:13px;opacity:.75;margin-top:2px;";
    body.textContent = ad.body || "";

    var cta = document.createElement("a");
    cta.href = ad.url;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer sponsored";
    cta.style.cssText =
      "display:inline-block;margin-top:8px;padding:6px 14px;border-radius:999px;" +
      "background:#5b4be0;color:#fff;text-decoration:none;font-size:13px;font-weight:600;";
    cta.textContent = ad.cta || "Découvrir";
    cta.addEventListener("click", function () {
      track(ad.campaignId, "click");
    });

    content.appendChild(sponsor);
    content.appendChild(headline);
    if (ad.body) content.appendChild(body);
    content.appendChild(cta);
    wrap.appendChild(logo);
    wrap.appendChild(content);
    container.appendChild(wrap);

    track(ad.campaignId, "impression");
  }

  function init() {
    var containers = document.querySelectorAll("[data-secret-ads]");
    if (containers.length === 0) return;

    var qs = "llm=" + encodeURIComponent(llm);
    if (topics) qs += "&topics=" + encodeURIComponent(topics);

    fetch(origin + "/api/ads?" + qs)
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        if (!json || !json.ad) return;
        containers.forEach(function (c) {
          render(c, json.ad);
        });
      })
      .catch(function () {
        /* pas de pub disponible : le conteneur reste vide */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
