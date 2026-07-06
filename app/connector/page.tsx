import type { Metadata } from "next";
import ConnectorPlayground from "@/components/ConnectorPlayground";

export const metadata: Metadata = {
  title: "Connecteur — Secret Ads",
  description:
    "Intégrez des publicités Secret Ads dans la barre de chargement de n'importe quel LLM : API REST + SDK JavaScript.",
};

const CURL_EXAMPLE = `curl "https://VOTRE-DOMAINE/api/ads?llm=claude&topics=tech,voyage"`;

const RESPONSE_EXAMPLE = `{
  "ad": {
    "id": "ad_cmp_notion_lz3k9",
    "campaignId": "cmp_notion",
    "advertiser": "Notion",
    "headline": "Notion AI organise vos idées pendant que l'IA réfléchit",
    "body": "Essayez l'espace de travail tout-en-un préféré des équipes produit.",
    "cta": "Essayer gratuitement",
    "url": "https://www.notion.so",
    "color": "#3987e5",
    "topic": "tech"
  },
  "meta": {
    "format": "loading-bar",
    "payouts": { "impression": 0.05, "click": 0.25, "conversionCashback": 1.5 },
    "track": "/api/track"
  }
}`;

const TRACK_EXAMPLE = `curl -X POST "https://VOTRE-DOMAINE/api/track" \\
  -H "Content-Type: application/json" \\
  -d '{ "campaignId": "cmp_notion", "event": "impression" }'`;

const SDK_EXAMPLE = `<!-- 1. Un conteneur là où la barre de chargement s'affiche -->
<div data-secret-ads></div>

<!-- 2. Le SDK : il remplit tous les conteneurs [data-secret-ads].
     data-uid = l'identifiant Secret Ads de l'utilisateur qui a installé
     le connecteur : ses gains remontent sur son portefeuille. -->
<script
  src="https://VOTRE-DOMAINE/sdk.js"
  data-llm="claude"
  data-topics="tech,voyage"
  data-uid="usr_votre_id"
  defer
></script>`;

const WALLET_EXAMPLE = `curl "https://VOTRE-DOMAINE/api/wallet?uid=usr_votre_id"
# → { "ok": true, "uid": "usr_votre_id",
#     "wallet": { "balance": 4.35, "lifetime": 12.85, "views": 41, "clicks": 9 } }`;

export default function ConnectorPage() {
  return (
    <main className="shell page">
      <div className="page-head">
        <div>
          <h1>Le connecteur LLM</h1>
          <p className="sub">
            Une seule intégration pour diffuser des publicités Secret Ads dans
            la barre de chargement de Claude, ChatGPT, Gemini, Mistral ou
            Perplexity : une API REST minimaliste, ou un SDK JavaScript à
            coller tel quel.
          </p>
        </div>
      </div>

      <section className="section">
        <h2>1. Servir une publicité</h2>
        <p className="muted small" style={{ marginBottom: "0.8rem" }}>
          <code>GET /api/ads</code> — paramètres : <code>llm</code>{" "}
          (claude | chatgpt | gemini | mistral | perplexity) et{" "}
          <code>topics</code> (liste de centres d&apos;intérêt séparés par des
          virgules). Le ciblage LLM est strict : seule une campagne qui cible
          ce LLM peut être servie ; les topics sont préférentiels. Sans
          campagne correspondante, la réponse est un 200 avec{" "}
          <code>ad: null</code> (no fill) ; un <code>llm</code> inconnu renvoie
          un 400.
        </p>
        <pre className="codeblock">{CURL_EXAMPLE}</pre>
        <div className="spacer" />
        <pre className="codeblock">{RESPONSE_EXAMPLE}</pre>
      </section>

      <section className="section">
        <h2>2. Tracker vue, clic, achat</h2>
        <p className="muted small" style={{ marginBottom: "0.8rem" }}>
          <code>POST /api/track</code> — envoyez{" "}
          <code>impression</code> quand la pub s&apos;affiche,{" "}
          <code>click</code> quand l&apos;utilisateur clique,{" "}
          <code>conversion</code> à l&apos;achat. La réponse contient le
          montant crédité à l&apos;utilisateur. Une campagne en pause ou dont
          le budget est épuisé renvoie un 409 et n&apos;est plus facturée.
        </p>
        <pre className="codeblock">{TRACK_EXAMPLE}</pre>
      </section>

      <section className="section">
        <h2>3. Ou en une balise : le SDK</h2>
        <p className="muted small" style={{ marginBottom: "0.8rem" }}>
          Le SDK récupère une pub, l&apos;affiche dans vos conteneurs{" "}
          <code>[data-secret-ads]</code> et envoie automatiquement
          l&apos;impression et les clics au tracking.
        </p>
        <pre className="codeblock">{SDK_EXAMPLE}</pre>
      </section>

      <section className="section">
        <h2>3 bis. Extension navigateur (côté utilisateur)</h2>
        <p className="muted small" style={{ marginBottom: "0.8rem" }}>
          Pour les LLM fermés (claude.ai, chatgpt.com, gemini.google.com,
          chat.mistral.ai, perplexity.ai), l&apos;utilisateur installe le
          connecteur dans SON navigateur :{" "}
          <a
            href="https://www.tampermonkey.net/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent)" }}
          >
            Tampermonkey
          </a>{" "}
          puis <a href="/userscript.user.js" style={{ color: "var(--accent)" }}>
            /userscript.user.js
          </a>
          . Le script détecte le LLM, affiche la pub pendant la génération et
          crédite le portefeuille de l&apos;utilisateur — sans rien demander
          aux plateformes.
        </p>
      </section>

      <section className="section">
        <h2>4. Le portefeuille de l&apos;utilisateur</h2>
        <p className="muted small" style={{ marginBottom: "0.8rem" }}>
          Quand le SDK (ou votre intégration) envoie un <code>uid</code> avec
          les événements, les gains s&apos;accumulent sur le portefeuille
          serveur de cet utilisateur — quel que soit le LLM ou le site hôte.
          Consultez-le avec <code>GET /api/wallet</code>. Essayez le connecteur
          installé en conditions réelles sur la{" "}
          <a href="/demo" style={{ color: "var(--accent)" }}>
            page de démo
          </a>
          .
        </p>
        <pre className="codeblock">{WALLET_EXAMPLE}</pre>
      </section>

      <section className="section">
        <h2>5. Playground</h2>
        <ConnectorPlayground />
      </section>
    </main>
  );
}
