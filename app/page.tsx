import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <span className="badge">
        <span className="dot" style={{ background: "var(--accent)" }} />
        MVP — Permile
      </span>
      <h1>
        Votre IA réfléchit.
        <br />
        Vous encaissez.
      </h1>
      <p>
        Une ligne sponsorisée s&apos;affiche pendant que Claude Code, Cursor
        ou ChatGPT génèrent — et vous êtes payé à chaque impression. Les
        annonceurs devtools touchent les développeurs au seul moment où ils
        regardent vraiment l&apos;écran sans rien faire.
      </p>
      <div className="home-ctas">
        <Link href="/dev" className="btn btn-primary">
          Je code avec l&apos;IA — installer
        </Link>
        <Link href="/advertiser" className="btn">
          Je suis annonceur
        </Link>
        <Link href="/demo" className="btn">
          Voir la démo
        </Link>
      </div>
    </main>
  );
}
