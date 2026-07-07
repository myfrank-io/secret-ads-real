// ==UserScript==
// @name         Permile — Connecteur LLM
// @namespace    https://secret-ads-real.vercel.app
// @version      0.1.0
// @description  Soyez payé pour voir des pubs pendant que votre IA génère ses réponses. Fonctionne sur Claude, ChatGPT, Gemini, Mistral et Perplexity.
// @match        https://claude.ai/*
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://gemini.google.com/*
// @match        https://chat.mistral.ai/*
// @match        https://www.perplexity.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      secret-ads-real.vercel.app
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ⚙️ Adaptez si votre déploiement est sur un autre domaine
  var API = "https://secret-ads-real.vercel.app";

  var LLM_BY_HOST = {
    "claude.ai": "claude",
    "chatgpt.com": "chatgpt",
    "chat.openai.com": "chatgpt",
    "gemini.google.com": "gemini",
    "chat.mistral.ai": "mistral",
    "www.perplexity.ai": "perplexity",
  };
  var llm = LLM_BY_HOST[location.hostname] || "claude";

  // Identifiant Permile : un par navigateur, partagé entre tous les LLM.
  // Menu Tampermonkey → « Définir mon identifiant » pour utiliser celui
  // affiché sur votre espace /earn (et retrouver vos gains au même endroit).
  var uid = GM_getValue("permileUid", "") || GM_getValue("secretAdsUid", "");
  if (!uid) {
    uid =
      "usr_ext_" +
      Date.now().toString(36) +
      Math.floor(Math.random() * 1e6).toString(36);
    GM_setValue("permileUid", uid);
  }
  GM_registerMenuCommand("Définir mon identifiant Permile", function () {
    var v = window.prompt(
      "Collez votre identifiant Permile (visible sur la page « Gagner de l'argent ») :",
      uid
    );
    if (v && /^[\w-]{1,64}$/.test(v.trim())) {
      uid = v.trim();
      GM_setValue("permileUid", uid);
    }
  });

  function api(method, path, body, onOk) {
    GM_xmlhttpRequest({
      method: method,
      url: API + path,
      headers: { "Content-Type": "application/json" },
      data: body ? JSON.stringify(body) : undefined,
      onload: function (res) {
        if (res.status >= 200 && res.status < 300 && onOk) {
          try {
            onOk(JSON.parse(res.responseText));
          } catch (e) {
            /* réponse inattendue : on ignore */
          }
        }
      },
    });
  }

  function track(campaignId, event) {
    api("POST", "/api/track", { campaignId: campaignId, event: event, uid: uid });
  }

  var COOLDOWN_MS = 20000; // une pub max toutes les 20 s, on reste discret
  var DISPLAY_MS = 8000; // durée d'affichage pendant la génération
  var lastShown = 0;
  var card = null;

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

  function showAd() {
    var now = Date.now();
    if (now - lastShown < COOLDOWN_MS || card) return;
    lastShown = now;

    api("GET", "/api/ads?llm=" + encodeURIComponent(llm), null, function (json) {
      if (!json || !json.ad) return;
      var ad = json.ad;

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
      var sponsor = el(
        "div",
        {
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          opacity: "0.6",
        },
        "Sponsorisé · " + ad.advertiser + " · Permile"
      );
      var headline = el(
        "div",
        { fontWeight: "600", marginTop: "2px" },
        ad.headline
      );
      var bodyText = ad.body
        ? el(
            "div",
            { fontSize: "13px", opacity: "0.75", marginTop: "2px" },
            ad.body
          )
        : null;

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

      var gain = el(
        "div",
        {
          fontSize: "11px",
          color: "#3fbf3f",
          marginTop: "6px",
          fontWeight: "600",
        },
        ""
      );

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

      content.appendChild(sponsor);
      content.appendChild(headline);
      if (bodyText) content.appendChild(bodyText);
      content.appendChild(cta);
      content.appendChild(gain);
      content.appendChild(barWrap);
      card.appendChild(logo);
      card.appendChild(content);
      card.appendChild(close);
      document.body.appendChild(card);

      // La barre progresse pendant la génération ; à 100 % la vue est
      // créditée sur votre portefeuille, puis la carte s'efface
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
    });
  }

  // Détection universelle du « envoi d'un prompt » : Entrée (sans Maj) dans
  // un champ de saisie, ou clic sur un bouton d'envoi. Volontairement
  // générique pour survivre aux refontes des interfaces LLM.
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
