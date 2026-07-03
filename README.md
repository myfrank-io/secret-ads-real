# secret-ads-real

Application [Next.js](https://nextjs.org) (App Router) déployée sur [Vercel](https://vercel.com).

## Développement local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Scripts

| Commande        | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Lance le serveur de développement        |
| `npm run build` | Compile l'application pour la production  |
| `npm run start` | Démarre le serveur de production          |
| `npm run lint`  | Analyse le code avec ESLint               |

## Déploiement Vercel

Le projet est connecté à Vercel. Chaque `git push` sur la branche de production
déclenche automatiquement un déploiement. Les Pull Requests génèrent des
déploiements de prévisualisation.

La configuration Vercel se trouve dans [`vercel.json`](./vercel.json).
