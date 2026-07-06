"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingBarAd from "@/components/LoadingBarAd";
import {
  ALL_LLMS,
  ALL_TOPICS,
  CASHOUT_THRESHOLD,
  LLM_LABELS,
  LLMTarget,
  PAYOUTS,
  ServedAd,
  TOPIC_LABELS,
  Topic,
} from "@/lib/types";

const STORAGE_KEY = "secret-ads-earn-v1";

interface EarnEvent {
  ts: number;
  type: "impression" | "click" | "conversion" | "cashout";
  label: string;
  amount: number; // négatif pour un retrait
}

interface EarnState {
  topics: Topic[];
  balance: number;
  lifetime: number;
  views: number;
  clicks: number;
  history: EarnEvent[];
}

const EMPTY_STATE: EarnState = {
  topics: [],
  balance: 0,
  lifetime: 0,
  views: 0,
  clicks: 0,
  history: [],
};

function loadState(): EarnState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<EarnState>;
    return {
      topics: Array.isArray(parsed.topics)
        ? (parsed.topics.filter((t) =>
            (ALL_TOPICS as string[]).includes(t as string)
          ) as Topic[])
        : [],
      balance: typeof parsed.balance === "number" ? parsed.balance : 0,
      lifetime: typeof parsed.lifetime === "number" ? parsed.lifetime : 0,
      views: typeof parsed.views === "number" ? parsed.views : 0,
      clicks: typeof parsed.clicks === "number" ? parsed.clicks : 0,
      history: Array.isArray(parsed.history)
        ? (parsed.history as EarnEvent[])
        : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

const PROMPTS = [
  "Explique-moi la différence entre un ETF et une action",
  "Rédige un mail de relance poli pour un client",
  "Idées de week-end pas cher à 2h de Paris ?",
  "Corrige et améliore ce paragraphe de mon mémoire",
  "Fais-moi un programme de course pour un 10 km",
  "Recette rapide avec courgettes et feta ?",
  "Résume-moi ce contrat de location en 5 points",
  "Comment négocier mon salaire en entretien ?",
];

interface Session {
  id: number;
  llm: LLMTarget;
  prompt: string;
  ad: ServedAd | null;
  clicked: boolean;
  converted: boolean;
  done: boolean;
}

export default function EarnPage() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<EarnState>(EMPTY_STATE);
  const [editingTopics, setEditingTopics] = useState(false);
  const [llm, setLlm] = useState<LLMTarget>("claude");
  const [session, setSession] = useState<Session | null>(null);
  const [starting, setStarting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCashout, setShowCashout] = useState(false);

  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // stockage indisponible : l'app reste utilisable sans persistance
    }
  }, [state, mounted]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const onboarding = mounted && state.topics.length === 0 && !editingTopics;

  const credit = (
    type: EarnEvent["type"],
    label: string,
    amount: number,
    extra?: Partial<Pick<EarnState, "views" | "clicks">>
  ) => {
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + amount) * 100) / 100,
      lifetime:
        amount > 0
          ? Math.round((prev.lifetime + amount) * 100) / 100
          : prev.lifetime,
      views: prev.views + (extra?.views ?? 0),
      clicks: prev.clicks + (extra?.clicks ?? 0),
      history: [{ ts: Date.now(), type, label, amount }, ...prev.history].slice(
        0,
        50
      ),
    }));
  };

  const track = (campaignId: string, event: "impression" | "click" | "conversion") => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, event }),
    }).catch(() => {
      // le tracking annonceur est best-effort côté démo
    });
  };

  const startSession = async () => {
    setStarting(true);
    try {
      const params = new URLSearchParams({ llm });
      if (state.topics.length > 0) params.set("topics", state.topics.join(","));
      const res = await fetch(`/api/ads?${params.toString()}`);
      const json = (await res.json()) as { ad: ServedAd | null };
      const ad = res.ok ? json.ad : null;
      setSession({
        id: Date.now(),
        llm,
        prompt: PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
        ad,
        clicked: false,
        converted: false,
        done: false,
      });
    } catch {
      setToast("Impossible de contacter la régie. Réessayez.");
    }
    setStarting(false);
  };

  const onSessionComplete = () => {
    setSession((prev) => {
      if (!prev || prev.done) return prev;
      if (prev.ad) {
        credit(
          "impression",
          `Pub vue — ${prev.ad.advertiser} (${LLM_LABELS[prev.llm]})`,
          PAYOUTS.impression,
          { views: 1 }
        );
        track(prev.ad.campaignId, "impression");
      }
      return { ...prev, done: true };
    });
  };

  const onAdClick = (ad: ServedAd) => {
    setSession((prev) => {
      if (!prev || prev.clicked) return prev;
      credit("click", `Clic — ${ad.advertiser}`, PAYOUTS.click, { clicks: 1 });
      track(ad.campaignId, "click");
      return { ...prev, clicked: true };
    });
  };

  const onConvert = () => {
    setSession((prev) => {
      if (!prev || !prev.ad || prev.converted) return prev;
      credit(
        "conversion",
        `Achat chez ${prev.ad.advertiser} — cashback`,
        PAYOUTS.conversionCashback
      );
      track(prev.ad.campaignId, "conversion");
      return { ...prev, converted: true };
    });
  };

  const requestCashout = () => {
    credit("cashout", "Retrait vers votre compte", -state.balance);
    setShowCashout(false);
    setToast("Demande de virement envoyée — sous 3 jours ouvrés.");
  };

  const toggleTopic = (t: Topic) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.includes(t)
        ? prev.topics.filter((x) => x !== t)
        : [...prev.topics, t],
    }));
  };

  const cashoutPct = useMemo(
    () => Math.min(100, (state.balance / CASHOUT_THRESHOLD) * 100),
    [state.balance]
  );

  if (!mounted) {
    return (
      <main className="shell page">
        <p className="muted">Chargement…</p>
      </main>
    );
  }

  if (onboarding) {
    return (
      <main className="shell page">
        <div className="page-head">
          <div>
            <h1>Soyez payé pour voir des pubs</h1>
            <p className="sub">
              Pendant que l&apos;IA génère sa réponse, une publicité
              s&apos;affiche dans la barre de chargement. Vous gagnez{" "}
              {eur(PAYOUTS.impression)} par vue, {eur(PAYOUTS.click)} par clic
              et {eur(PAYOUTS.conversionCashback)} de cashback par achat.
            </p>
          </div>
        </div>
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-title">
            Choisissez vos centres d&apos;intérêt (min. 1)
          </div>
          <p className="muted small" style={{ marginBottom: "1rem" }}>
            Vous ne verrez que des pubs qui vous correspondent — et elles
            paient mieux.
          </p>
          <div className="chip-row" style={{ marginBottom: "1.25rem" }}>
            {ALL_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${state.topics.includes(t) ? "selected" : ""}`}
                onClick={() => toggleTopic(t)}
              >
                {TOPIC_LABELS[t]}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary"
            disabled={state.topics.length === 0}
            onClick={() => setEditingTopics(false)}
          >
            Commencer à gagner
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="shell page">
      <div className="page-head">
        <div>
          <h1>Mon espace gains</h1>
          <p className="sub">
            {eur(PAYOUTS.impression)} par pub vue · {eur(PAYOUTS.click)} par
            clic · {eur(PAYOUTS.conversionCashback)} de cashback par achat.
          </p>
        </div>
        <button className="btn" onClick={() => setEditingTopics(true)}>
          Mes centres d&apos;intérêt ({state.topics.length})
        </button>
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="label">Solde disponible</div>
          <div className="value">{eur(state.balance)}</div>
        </div>
        <div className="tile">
          <div className="label">Gains cumulés</div>
          <div className="value">{eur(state.lifetime)}</div>
        </div>
        <div className="tile">
          <div className="label">Pubs vues</div>
          <div className="value">{state.views}</div>
        </div>
        <div className="tile">
          <div className="label">Clics</div>
          <div className="value">{state.clicks}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-title">Session sponsorisée</div>
          <p className="muted small" style={{ marginBottom: "0.9rem" }}>
            Simulez une conversation IA : la pub s&apos;affiche pendant la
            génération, vos gains sont crédités automatiquement.
          </p>
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

          {session ? (
            <>
              <LoadingBarAd
                key={session.id}
                llmLabel={LLM_LABELS[session.llm]}
                prompt={session.prompt}
                ad={session.ad}
                durationMs={5000}
                onComplete={onSessionComplete}
                onAdClick={onAdClick}
              />
              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  marginTop: "0.9rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {session.done && session.ad && (
                  <span className="badge">
                    <span className="dot" style={{ background: "var(--good)" }} />
                    +{eur(PAYOUTS.impression)} crédités
                  </span>
                )}
                {session.clicked && (
                  <span className="badge">
                    <span className="dot" style={{ background: "var(--good)" }} />
                    +{eur(PAYOUTS.click)} pour le clic
                  </span>
                )}
                {session.clicked && !session.converted && (
                  <button className="btn btn-sm" onClick={onConvert}>
                    Simuler un achat (+{eur(PAYOUTS.conversionCashback)})
                  </button>
                )}
                {session.converted && (
                  <span className="badge">
                    <span className="dot" style={{ background: "var(--good)" }} />
                    Cashback {eur(PAYOUTS.conversionCashback)} crédité
                  </span>
                )}
                {session.done && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={startSession}
                    disabled={starting}
                  >
                    Nouvelle session
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={startSession}
              disabled={starting}
            >
              {starting ? "Recherche d'une pub…" : "Lancer une session"}
            </button>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: "0.9rem" }}>
            <div className="card-title">Retrait</div>
            <div className="progress-row" style={{ marginBottom: "0.7rem" }}>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${cashoutPct}%` }}
                />
              </div>
              <span style={{ whiteSpace: "nowrap" }}>
                {eur(state.balance)} / {eur(CASHOUT_THRESHOLD)}
              </span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              disabled={state.balance < CASHOUT_THRESHOLD}
              onClick={() => setShowCashout(true)}
            >
              Retirer mes gains
            </button>
            {state.balance < CASHOUT_THRESHOLD && (
              <p className="muted small" style={{ marginTop: "0.6rem" }}>
                Seuil de retrait : {eur(CASHOUT_THRESHOLD)}.
              </p>
            )}
          </div>

          <div className="card">
            <div className="card-title">Historique</div>
            {state.history.length === 0 ? (
              <p className="muted small">
                Lancez votre première session pour commencer à gagner.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {state.history.slice(0, 10).map((h) => (
                  <div
                    key={`${h.ts}-${h.type}-${h.amount}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      fontSize: "0.86rem",
                    }}
                  >
                    <span className="muted" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.label}
                    </span>
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        color: h.amount >= 0 ? "var(--good)" : "var(--ink-2)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.amount >= 0 ? "+" : ""}
                      {eur(h.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingTopics && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingTopics(false);
          }}
        >
          <div className="modal">
            <h2>Mes centres d&apos;intérêt</h2>
            <div className="chip-row" style={{ marginBottom: "1.25rem" }}>
              {ALL_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${state.topics.includes(t) ? "selected" : ""}`}
                  onClick={() => toggleTopic(t)}
                >
                  {TOPIC_LABELS[t]}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary"
              disabled={state.topics.length === 0}
              onClick={() => setEditingTopics(false)}
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {showCashout && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCashout(false);
          }}
        >
          <div className="modal">
            <h2>Retirer {eur(state.balance)}</h2>
            <p className="muted small" style={{ marginBottom: "1rem" }}>
              MVP : le virement est simulé. En production, connectez Stripe
              Connect ou un IBAN.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setShowCashout(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={requestCashout}>
                Confirmer le virement
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
