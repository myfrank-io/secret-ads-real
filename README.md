# Secret Ads

La régie publicitaire des barres de chargement IA. Les annonceurs diffusent
leurs publicités pendant que Claude, ChatGPT, Gemini, Mistral ou Perplexity
génèrent leurs réponses ; les utilisateurs qui les regardent sont rémunérés à
la vue, au clic et à l'achat.

Application [Next.js](https://nextjs.org) (App Router) déployée sur
[Vercel](https://vercel.com).

## Les 3 briques du MVP

| Brique | Où | Description |
| --- | --- | --- |
| **Connecteur LLM** | `/connector` + `/api/ads` + `/api/track` + `public/sdk.js` | API REST + SDK JavaScript pour servir une pub dans la barre de chargement de n'importe quel LLM et tracker vues / clics / achats. |
| **Interface annonceurs** | `/advertiser` | Dashboard : dépense, impressions, CTR, conversions, CPA, ROAS, graphiques journaliers, création et pause de campagnes. |
| **Interface utilisateurs** | `/earn` | Choix des centres d'intérêt, sessions sponsorisées simulées, gains crédités en temps réel (0,05 € / vue, 0,25 € / clic, 1,50 € de cashback), historique et retrait. |

## API du connecteur

```bash
# Servir une pub ciblée
curl "https://VOTRE-DOMAINE/api/ads?llm=claude&topics=tech,voyage"

# Tracker un événement
curl -X POST "https://VOTRE-DOMAINE/api/track" \
  -H "Content-Type: application/json" \
  -d '{ "campaignId": "cmp_notion", "event": "impression" }'
```

Ou en une balise :

```html
<div data-secret-ads></div>
<script src="https://VOTRE-DOMAINE/sdk.js" data-llm="claude" data-topics="tech" defer></script>
```

## Développement local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Notes MVP

- Les données (campagnes, métriques) vivent en mémoire avec un seed
  déterministe : parfait pour la démo, à remplacer par une base
  (Vercel Postgres / KV) pour la production.
- Les gains utilisateurs sont persistés en `localStorage`.
- Le déploiement est continu via Vercel : chaque push sur `main` déploie en
  production, chaque PR génère une preview.
