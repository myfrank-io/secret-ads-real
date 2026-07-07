// Secret Ads — content script : détecte l'envoi d'un prompt sur le site LLM
// hôte, affiche la carte sponsorisée pendant la génération et remonte
// vues/clics au service worker (qui parle à l'API avec votre uid).

(function () {
  "use strict";

  var LLM_BY_HOST = {
    "claude.ai": "claude",
    "chatgpt.com": "chatgpt",
    "chat.openai.com": "chatgpt",
    "gemini.google.com": "gemini",
    "chat.mistral.ai": "mistral",
    "www.perplexity.ai": "perplexity",
  };
  var llm = LLM_BY_HOST[location.hostname] || "claude";

  var COOLDOWN_MS = 20000;
  var DISPLAY_MS = 8000;
  var lastShown = 0;
  var card = null;

  function track(campaignId, event) {
    try {
      chrome.runtime.sendMessage({ type: "track", campaignId: campaignId, event: event });
    } catch (e) {
      /* contexte invalidé (mise à jour de l'extension) : on ignore */
    }
  }

  function removeCard() {
    if (card && card.parentNode) card.parentNode.removeChild(card);
    card = null;
  }

  function el(tag, styles, text) {
    var node = document.createElement(tag);
    for (var k in styles) node.style[k] = styles[k];
    if (text) node.textContent = text;
    return node;
  }

  function renderAd(ad) {
    removeCard();
    card = el("div", {
      position: "fixed",
      right: "18px",
      bottom: "18px",
      zIndex: "999999",
      width: "340px",
      maxWidth: "calc(100vw - 36px)",
      background: "#1a1a19",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: "12px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      fontSize: "14px",
      lineHeight: "1.45",
      padding: "12px 14px",
      display: "flex",
      gap: "12px",
      alignItems: "flex-start",
    });

    var logo = el(
      "div",
      {
        width: "34px",
        height: "34px",
        borderRadius: "9px",
        flexShrink: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        color: "#fff",
        background: ad.color || "#5b4be0",
      },
      (ad.advertiser || "?").charAt(0)
    );

    var content = el("div", { flex: "1", minWidth: "0" });
    content.appendChild(
      el(
        "div",
        {
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          opacity: "0.6",
        },
        "Sponsorisé · " + ad.advertiser + " · Secret Ads"
      )
    );
    content.appendChild(
      el("div", { fontWeight: "600", marginTop: "2px" }, ad.headline)
    );
    if (ad.body) {
      content.appendChild(
        el(
          "div",
          { fontSize: "13px", opacity: "0.75", marginTop: "2px" },
          ad.body
        )
      );
    }

    var cta = el("a", {
      display: "inline-block",
      marginTop: "8px",
      padding: "6px 14px",
      borderRadius: "999px",
      background: "#5b4be0",
      color: "#fff",
      textDecoration: "none",
      fontSize: "13px",
      fontWeight: "600",
    });
    cta.textContent = ad.cta || "Découvrir";
    cta.href = ad.url;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer sponsored";
    cta.addEventListener("click", function () {
      track(ad.campaignId, "click");
    });
    content.appendChild(cta);

    var gain = el("div", {
      fontSize: "11px",
      color: "#3fbf3f",
      marginTop: "6px",
      fontWeight: "600",
    });
    content.appendChild(gain);

    var barWrap = el("div", {
      height: "4px",
      background: "rgba(255,255,255,0.12)",
      borderRadius: "999px",
      overflow: "hidden",
      marginTop: "9px",
    });
    var bar = el("div", {
      height: "100%",
      width: "0%",
      background: "linear-gradient(90deg,#5b4be0,#9085e9)",
      borderRadius: "999px",
    });
    barWrap.appendChild(bar);
    content.appendChild(barWrap);

    var close = el(
      "button",
      {
        position: "absolute",
        top: "6px",
        right: "9px",
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.5)",
        fontSize: "15px",
        cursor: "pointer",
        padding: "2px",
      },
      "×"
    );
    close.setAttribute("aria-label", "Fermer");
    close.addEventListener("click", removeCard);

    card.appendChild(logo);
    card.appendChild(content);
    card.appendChild(close);
    document.body.appendChild(card);

    var started = Date.now();
    var credited = false;
    var timer = setInterval(function () {
      if (!card) {
        clearInterval(timer);
        return;
      }
      var pct = Math.min(100, ((Date.now() - started) / DISPLAY_MS) * 100);
      bar.style.width = pct + "%";
      if (pct >= 100) {
        clearInterval(timer);
        if (!credited) {
          credited = true;
          track(ad.campaignId, "impression");
          gain.textContent = "+0,05 € crédités sur votre compte ✓";
          setTimeout(removeCard, 2500);
        }
      }
    }, 100);
  }

  function showAd() {
    var now = Date.now();
    if (now - lastShown < COOLDOWN_MS || card) return;
    lastShown = now;
    try {
      chrome.runtime.sendMessage({ type: "serveAd", llm: llm }, function (res) {
        if (chrome.runtime.lastError) return;
        if (res && res.ad) renderAd(res.ad);
      });
    } catch (e) {
      /* contexte invalidé : on ignore */
    }
  }

  // Détection universelle de l'envoi d'un prompt (voir userscript) :
  // Entrée sans Maj dans un champ éditable, ou clic sur un bouton d'envoi.
  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Enter" || e.shiftKey) return;
      var t = e.target;
      if (!t) return;
      var editable =
        t.tagName === "TEXTAREA" ||
        (t.getAttribute && t.getAttribute("contenteditable") === "true") ||
        (t.closest && t.closest("[contenteditable='true']"));
      if (editable) showAd();
    },
    true
  );

  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest("button[aria-label]");
      if (!btn) return;
      var label = (btn.getAttribute("aria-label") || "").toLowerCase();
      if (
        label.indexOf("send") !== -1 ||
        label.indexOf("envoyer") !== -1 ||
        label.indexOf("submit") !== -1
      ) {
        showAd();
      }
    },
    true
  );
})();
