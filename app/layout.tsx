import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Permile — La régie publicitaire des IA",
  description:
    "Diffusez des publicités dans les barres de chargement de Claude, ChatGPT, Gemini… et rémunérez les utilisateurs qui les regardent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <header className="nav">
          <div className="shell nav-inner">
            <Link href="/" className="brand">
              <span className="brand-dot">▮</span>
              Permile
            </Link>
            <nav className="nav-links">
              <Link href="/dev">Devs</Link>
              <Link href="/advertiser">Annonceurs</Link>
              <Link href="/earn">Gagner de l&apos;argent</Link>
              <Link href="/demo">Démo</Link>
              <Link href="/connector">Connecteur</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="shell">
            Permile — MVP. Les publicités s&apos;affichent pendant la
            génération des réponses IA ; les utilisateurs sont rémunérés à la
            vue, au clic et à l&apos;achat.
          </div>
        </footer>
      </body>
    </html>
  );
}
