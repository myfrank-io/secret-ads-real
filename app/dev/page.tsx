"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOrCreateUid } from "@/lib/earn-state";
import { PAYOUTS } from "@/lib/types";

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function DevPage() {
  const [mounted, setMounted] = useState(false);
  const [uid, setUid] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setUid(getOrCreateUid());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://secret-ads-real.vercel.app";

  const installCmd = `curl -fsSL ${origin}/statusline.sh -o ~/.claude/permile-statusline.sh && chmod +x ~/.claude/permile-statusline.sh`;
  const settingsSnippet = `{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/permile-statusline.sh"
  }
}`;
  const uidExport = `export PERMILE_UID="${uid}"`;

  const copy = (text: string, key: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setCopied(key))
      .catch(() => {});
  };

  if (!mounted) {
    return (
      <main className="shell page">
        <p className="muted">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="shell page">
      <div className="page-head">
        <div>
          <h1>Vous codez avec l&apos;IA. Encaissez les temps d&apos;attente.</h1>
          <p className="sub">
            Chaque fois que Claude Code réfléchit, sa status line affiche une
            ligne sponsorisée d&apos;un annonceur devtools — et votre
            portefeuille Permile est crédité de {eur(PAYOUTS.impression)} par
            impression. Une ligne de texte, jamais une popup. Rien de votre
            code, de vos prompts ou de votre contexte n&apos;est lu ni
            transmis.
          </p>
        </div>
        <Link href="/earn" className="btn">
          Mon portefeuille →
        </Link>
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="label">Par impression (≥ 60 s)</div>
          <div className="value">{eur(PAYOUTS.impression)}</div>
        </div>
        <div className="tile">
          <div className="label">Par clic annonceur</div>
          <div className="value">{eur(PAYOUTS.click)}</div>
        </div>
        <div className="tile">
          <div className="label">~4 h de code IA / jour</div>
          <div className="value">≈ {eur(4 * 60 * PAYOUTS.impression)}</div>
        </div>
        <div className="tile">
          <div className="label">Retrait dès</div>
          <div className="value">10 €</div>
        </div>
      </div>

      <section className="section">
        <h2>Installer sur Claude Code (2 minutes)</h2>

        <div className="card" style={{ marginBottom: "0.9rem" }}>
          <div className="card-title">1. Télécharger la status line</div>
          <pre className="codeblock">{installCmd}</pre>
          <div className="spacer" />
          <button
            className="btn btn-sm"
            onClick={() => copy(installCmd, "install")}
          >
            {copied === "install" ? "Copié ✓" : "Copier"}
          </button>
        </div>

        <div className="card" style={{ marginBottom: "0.9rem" }}>
          <div className="card-title">
            2. L&apos;activer dans <code>~/.claude/settings.json</code>
          </div>
          <pre className="codeblock">{settingsSnippet}</pre>
          <div className="spacer" />
          <button
            className="btn btn-sm"
            onClick={() => copy(settingsSnippet, "settings")}
          >
            {copied === "settings" ? "Copié ✓" : "Copier"}
          </button>
        </div>

        <div className="card">
          <div className="card-title">
            3. Lier votre identifiant (vos gains arrivent ici)
          </div>
          <pre className="codeblock">{uidExport}</pre>
          <p className="muted small" style={{ margin: "0.8rem 0" }}>
            Ajoutez cette ligne à votre <code>~/.zshrc</code> ou{" "}
            <code>~/.bashrc</code>. Sans elle, un identifiant local est généré
            — vous pourrez le lier plus tard.
          </p>
          <button className="btn btn-sm" onClick={() => copy(uidExport, "uid")}>
            {copied === "uid" ? "Copié ✓" : "Copier"}
          </button>
        </div>
      </section>

      <section className="section">
        <h2>Les règles, sans surprise</h2>
        <ul
          className="muted"
          style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}
        >
          <li>
            <strong>Une impression par minute maximum</strong> — le script
            s&apos;auto-limite (TTL 60 s), pas de farming possible.
          </li>
          <li>
            <strong>Zéro lecture de contexte</strong> — le script jette le
            JSON que Claude Code lui passe et ne fait qu&apos;une requête
            sortante. Le code est lisible :{" "}
            <a href="/statusline.sh" style={{ color: "var(--accent)" }}>
              /statusline.sh
            </a>
            .
          </li>
          <li>
            <strong>Des annonceurs devtools uniquement</strong> sur ce format
            — pas de crypto douteuse ni de casino.
          </li>
          <li>
            Navigateur plutôt que terminal ? L&apos;
            <a href="/earn" style={{ color: "var(--accent)" }}>
              extension Chrome
            </a>{" "}
            couvre claude.ai, chatgpt.com, gemini, mistral et perplexity.
          </li>
        </ul>
      </section>
    </main>
  );
}
