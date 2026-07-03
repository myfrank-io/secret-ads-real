export default function Home() {
  return (
    <main className="container">
      <span className="badge">Déployé sur Vercel</span>
      <h1>Secret Ads</h1>
      <p>
        Ce projet Next.js (App Router) est prêt et déployé en continu via
        Vercel. Poussez sur la branche connectée pour déclencher un nouveau
        déploiement.
      </p>
      <a
        className="link"
        href="https://nextjs.org/docs"
        target="_blank"
        rel="noreferrer"
      >
        Documentation Next.js →
      </a>
    </main>
  );
}
