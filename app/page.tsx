import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <span className="badge">
        <span className="dot" style={{ background: "var(--accent)" }} />
        MVP — Secret Ads
      </span>
      <h1>
        La régie publicitaire
        <br />
        des barres de chargement IA
      </h1>
      <p>
        Les annonceurs diffusent leurs publicités pendant que Claude, ChatGPT
        ou Gemini génèrent leurs réponses. Les utilisateurs qui les regardent
        sont payés à la vue, au clic et à l&apos;achat.
      </p>
      <div className="home-ctas">
        <Link href="/advertiser" className="btn btn-primary">
          Je suis annonceur
        </Link>
        <Link href="/earn" className="btn">
          Je veux être payé pour voir des pubs
        </Link>
        <Link href="/connector" className="btn">
          Intégrer le connecteur
        </Link>
      </div>
    </main>
  );
}
