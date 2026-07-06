"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  EarnEvent,
  EarnState,
  EMPTY_EARN_STATE,
  getOrCreateUid,
  loadEarnState,
  saveEarnState,
} from "@/lib/earn-state";
import {
  ALL_LLMS,
  LLM_LABELS,
  LLMTarget,
  PAYOUTS,
  ServedAd,
} from "@/lib/types";

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

const SUGGESTIONS = [
  "Compare-moi les 3 meilleures cartes bancaires gratuites",
  "Fais-moi un itinéraire de 5 jours au Portugal",
  "Explique-moi les bases de React en 10 lignes",
  "Un menu de la semaine équilibré à moins de 50 € ?",
];

const CANNED_ANSWERS = [
  "Excellente question ! Voici une synthèse structurée : d'abord les critères qui comptent vraiment, ensuite un comparatif rapide, et enfin ma recommandation selon votre profil. (réponse simulée pour la démo Secret Ads)",
  "Voici ce que je propose, étape par étape, avec les points d'attention et deux alternatives si vous voulez ajuster le budget ou le rythme. (réponse simulée pour la démo Secret Ads)",
  "Bonne idée — je vous ai préparé un plan clair avec les essentiels, les pièges à éviter et une checklist actionnable dès aujourd'hui. (réponse simulée pour la démo Secret Ads)",
];

interface Exchange {
  id: number;
  prompt: string;
  ad: ServedAd | null;
  progress: number;
  done: boolean;
  clicked: boolean;
  answer: string;
}

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const [uid, setUid] = useState("");
  const [earn, setEarn] = useState<EarnState>(EMPTY_EARN_STATE);
  const [llm, setLlm] = useState<LLMTarget>("claude");
  const [input, setInput] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);

  const seqRef = useRef(0);
  const creditedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEarn(loadEarnState());
    setUid(getOrCreateUid());
    setMounted(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveEarnState(earn);
  }, [earn, mounted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges]);

  const credit = (
    type: EarnEvent["type"],
    label: string,
    amount: number,
    extra?: { views?: number; clicks?: number }
  ) => {
    seqRef.current += 1;
    const event: EarnEvent = {
      id: `${Date.now().toString(36)}-demo-${seqRef.current}`,
      ts: Date.now(),
      type,
      label,
      amount,
    };
    setEarn((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + amount) * 100) / 100,
      lifetime: Math.round((prev.lifetime + amount) * 100) / 100,
      views: prev.views + (extra?.views ?? 0),
      clicks: prev.clicks + (extra?.clicks ?? 0),
      history: [event, ...prev.history].slice(0, 50),
    }));
  };

  const track = (
    campaignId: string,
    event: "impression" | "click" | "conversion"
  ) => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        uid ? { campaignId, event, uid } : { campaignId, event }
      ),
    }).catch(() => {
      // best-effort
    });
  };

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setInput("");
    setBusy(true);

    seqRef.current += 1;
    const id = seqRef.current;

    let ad: ServedAd | null = null;
    try {
      const params = new URLSearchParams({ llm });
      if (earn.topics.length > 0) params.set("topics", earn.topics.join(","));
      const res = await fetch(`/api/ads?${params.toString()}`);
      const json = (await res.json()) as { ad: ServedAd | null };
      ad = res.ok ? json.ad : null;
    } catch {
      ad = null;
    }

    const answer =
      CANNED_ANSWERS[Math.floor(Math.random() * CANNED_ANSWERS.length)];
    setExchanges((prev) => [
      ...prev,
      { id, prompt, ad, progress: 0, done: false, clicked: false, answer },
    ]);

    // Génération simulée : la barre progresse pendant ~5 s, la pub est
    // visible pendant tout ce temps — c'est l'emplacement Secret Ads
    const started = Date.now();
    const durationMs = 5000;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / durationMs) * 100);
      setExchanges((prev) =>
        prev.map((e) => (e.id === id ? { ...e, progress: pct } : e))
      );
      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        const key = `${id}:impression`;
        if (ad && !creditedRef.current.has(key)) {
          creditedRef.current.add(key);
          credit(
            "impression",
            `Pub vue — ${ad.advertiser} (${LLM_LABELS[llm]}, démo)`,
            PAYOUTS.impression,
            { views: 1 }
          );
          track(ad.campaignId, "impression");
        }
        setExchanges((prev) =>
          prev.map((e) => (e.id === id ? { ...e, done: true } : e))
        );
        setBusy(false);
      }
    }, 80);
  };

  const onAdClick = (exchange: Exchange) => {
    if (!exchange.ad) return;
    const key = `${exchange.id}:click`;
    if (!creditedRef.current.has(key)) {
      creditedRef.current.add(key);
      credit(
        "click",
        `Clic — ${exchange.ad.advertiser} (démo)`,
        PAYOUTS.click,
        { clicks: 1 }
      );
      track(exchange.ad.campaignId, "click");
      setExchanges((prev) =>
        prev.map((e) => (e.id === exchange.id ? { ...e, clicked: true } : e))
      );
    }
    window.open(exchange.ad.url, "_blank", "noopener,noreferrer");
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
          <h1>Votre LLM, avec Secret Ads installé</h1>
          <p className="sub">
            Démo du connecteur : discutez normalement — pendant que l&apos;IA
            « génère », la pub s&apos;affiche dans la barre de chargement et
            vos gains tombent en direct sur votre compte ({uid || "…"}).
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <span className="badge">
            <span className="dot" style={{ background: "var(--good)" }} />
            Solde : {eur(earn.balance)}
          </span>
          <Link href="/earn" className="btn btn-sm">
            Mon espace gains →
          </Link>
        </div>
      </div>

      <div className="chip-row" style={{ marginBottom: "1rem" }}>
        {ALL_LLMS.map((l) => (
          <button
            key={l}
            type="button"
            className={`chip ${llm === l ? "selected" : ""}`}
            onClick={() => setLlm(l)}
          >
            {LLM_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="llm-frame" style={{ marginBottom: "1rem" }}>
        <div className="llm-frame-head">
          <span
            className="dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: busy ? "var(--warning)" : "var(--good)",
              display: "inline-block",
            }}
          />
          {LLM_LABELS[llm]} — connecteur Secret Ads actif
        </div>
        <div
          className="llm-frame-body"
          style={{ minHeight: 320, maxHeight: 480, overflowY: "auto" }}
        >
          {exchanges.length === 0 && (
            <p className="muted small" style={{ textAlign: "center", margin: "auto" }}>
              Posez une question pour voir le connecteur en action.
            </p>
          )}

          {exchanges.map((e) => (
            <div key={e.id} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div className="llm-prompt">{e.prompt}</div>

              {e.ad ? (
                <div className="ad-slot">
                  <div className="ad-logo" style={{ background: e.ad.color }}>
                    {e.ad.advertiser.charAt(0)}
                  </div>
                  <div className="ad-content">
                    <div className="ad-sponsor">
                      Sponsorisé · {e.ad.advertiser}
                      {e.done && (
                        <span style={{ color: "var(--good)" }}>
                          {" "}
                          · +{eur(PAYOUTS.impression)} crédités
                        </span>
                      )}
                    </div>
                    <div className="ad-headline">{e.ad.headline}</div>
                    {e.ad.body ? (
                      <div className="ad-body">{e.ad.body}</div>
                    ) : null}
                    <div className="ad-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => onAdClick(e)}
                      >
                        {e.ad.cta}
                      </button>
                      {e.clicked && (
                        <span className="badge">
                          <span
                            className="dot"
                            style={{ background: "var(--good)" }}
                          />
                          +{eur(PAYOUTS.click)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ad-slot">
                  <div className="ad-content">
                    <div className="ad-sponsor">Secret Ads</div>
                    <div className="ad-body">
                      Aucune campagne active pour ce ciblage.
                    </div>
                  </div>
                </div>
              )}

              {!e.done ? (
                <div className="progress-row">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.round(e.progress)}%` }}
                    />
                  </div>
                  <span style={{ minWidth: 38, textAlign: "right" }}>
                    {Math.round(e.progress)}%
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.7rem 0.9rem",
                    fontSize: "0.9rem",
                    color: "var(--ink-2)",
                    maxWidth: "85%",
                  }}
                >
                  {e.answer}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{ display: "flex", gap: "0.6rem", marginBottom: "0.8rem" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Écrivez à ${LLM_LABELS[llm]}…`}
          style={{
            flex: 1,
            background: "var(--surface-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            color: "var(--ink)",
            padding: "0.6rem 0.85rem",
            fontSize: "0.92rem",
            outline: "none",
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
          {busy ? "Génération…" : "Envoyer"}
        </button>
      </form>

      <div className="chip-row">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            onClick={() => send(s)}
            disabled={busy}
          >
            {s}
          </button>
        ))}
      </div>
    </main>
  );
}
