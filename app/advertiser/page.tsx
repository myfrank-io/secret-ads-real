"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BarChart from "@/components/BarChart";
import {
  ALL_LLMS,
  ALL_TOPICS,
  CampaignWithMetrics,
  LLM_LABELS,
  LLMTarget,
  TOPIC_LABELS,
  Topic,
} from "@/lib/types";

function eur(v: number): string {
  const rounded = v >= 1000;
  return v.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: rounded ? 0 : 2,
    maximumFractionDigits: rounded ? 0 : 2,
  });
}

function num(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (v >= 10000) return `${(v / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} k`;
  return v.toLocaleString("fr-FR");
}

function pct(v: number): string {
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

interface DayAgg {
  date: string;
  impressions: number;
  spend: number;
}

export default function AdvertiserPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { campaigns: CampaignWithMetrics[] };
      setCampaigns(json.campaigns);
      setError(null);
    } catch {
      setError("Impossible de charger les campagnes.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const totals = useMemo(() => {
    if (!campaigns) return null;
    const sum = campaigns.reduce(
      (acc, c) => ({
        impressions: acc.impressions + c.totals.impressions,
        clicks: acc.clicks + c.totals.clicks,
        conversions: acc.conversions + c.totals.conversions,
        spend: acc.spend + c.totals.spend,
        revenue: acc.revenue + c.totals.revenue,
      }),
      { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
    );
    return {
      ...sum,
      ctr: sum.impressions > 0 ? (sum.clicks / sum.impressions) * 100 : 0,
      roas: sum.spend > 0 ? sum.revenue / sum.spend : 0,
    };
  }, [campaigns]);

  // Agrégation par jour (14 derniers jours) toutes campagnes confondues
  const dailyAgg = useMemo<DayAgg[]>(() => {
    if (!campaigns) return [];
    const byDate = new Map<string, DayAgg>();
    campaigns.forEach((c) => {
      c.daily.forEach((d) => {
        const cur = byDate.get(d.date) ?? {
          date: d.date,
          impressions: 0,
          spend: 0,
        };
        cur.impressions += d.impressions;
        cur.spend += d.spend;
        byDate.set(d.date, cur);
      });
    });
    return Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [campaigns]);

  // Variation : 7 derniers jours vs 7 précédents
  const weekDelta = useMemo(() => {
    if (dailyAgg.length < 14) return null;
    const last7 = dailyAgg.slice(-7).reduce((s, d) => s + d.impressions, 0);
    const prev7 = dailyAgg.slice(0, 7).reduce((s, d) => s + d.impressions, 0);
    if (prev7 === 0) return null;
    return ((last7 - prev7) / prev7) * 100;
  }, [dailyAgg]);

  const toggleStatus = async (c: CampaignWithMetrics) => {
    const next = c.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/campaigns/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      setToast(
        next === "paused" ? "Campagne mise en pause." : "Campagne réactivée."
      );
      load();
    } catch {
      setToast("Échec de la mise à jour.");
    }
  };

  return (
    <main className="shell page">
      <div className="page-head">
        <div>
          <h1>Espace annonceurs</h1>
          <p className="sub">
            Vos campagnes diffusées dans les barres de chargement de{" "}
            {ALL_LLMS.slice(0, -1)
              .map((l) => LLM_LABELS[l])
              .join(", ")}{" "}
            et {LLM_LABELS[ALL_LLMS[ALL_LLMS.length - 1]]} — métriques des 30
            derniers jours.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nouvelle campagne
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {!campaigns && !error && <p className="muted">Chargement…</p>}

      {campaigns && totals && (
        <>
          <div className="tiles">
            <div className="tile">
              <div className="label">Dépense (30 j)</div>
              <div className="value">{eur(totals.spend)}</div>
            </div>
            <div className="tile">
              <div className="label">Impressions</div>
              <div className="value">{num(totals.impressions)}</div>
              {weekDelta !== null && (
                <div
                  className={`delta ${weekDelta >= 0 ? "delta-up" : "delta-down"}`}
                >
                  {weekDelta >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(weekDelta).toLocaleString("fr-FR", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  % vs sem. précédente
                </div>
              )}
            </div>
            <div className="tile">
              <div className="label">CTR moyen</div>
              <div className="value">{pct(totals.ctr)}</div>
            </div>
            <div className="tile">
              <div className="label">Conversions</div>
              <div className="value">{num(totals.conversions)}</div>
            </div>
            <div className="tile">
              <div className="label">ROAS</div>
              <div className="value">
                {totals.roas.toLocaleString("fr-FR", {
                  maximumFractionDigits: 2,
                })}
                ×
              </div>
            </div>
          </div>

          <div className="chart-grid">
            <BarChart
              title="Impressions par jour (14 j)"
              data={dailyAgg.map((d) => ({
                date: d.date,
                value: d.impressions,
              }))}
              color="var(--series-1)"
              formatValue={num}
            />
            <BarChart
              title="Dépense par jour (14 j)"
              data={dailyAgg.map((d) => ({ date: d.date, value: d.spend }))}
              color="var(--series-2)"
              formatValue={eur}
            />
          </div>

          <div className="section">
            <h2>Campagnes ({campaigns.length})</h2>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Campagne</th>
                    <th>Diffusion</th>
                    <th>Statut</th>
                    <th className="num">Budget</th>
                    <th className="num">Dépense</th>
                    <th className="num">Impr.</th>
                    <th className="num">Clics</th>
                    <th className="num">CTR</th>
                    <th className="num">CPC réel</th>
                    <th className="num">Conv.</th>
                    <th className="num">CVR</th>
                    <th className="num">CPA</th>
                    <th className="num">ROAS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div className="muted small">
                          {c.advertiser} · {TOPIC_LABELS[c.topic]}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {c.targets.map((t) => (
                            <span key={t} className="badge">
                              {LLM_LABELS[t]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="badge">
                          <span
                            className="dot"
                            style={{
                              background:
                                c.status === "active"
                                  ? "var(--good)"
                                  : c.status === "paused"
                                    ? "var(--warning)"
                                    : "var(--ink-3)",
                            }}
                          />
                          {c.status === "active"
                            ? "Active"
                            : c.status === "paused"
                              ? "En pause"
                              : "Terminée"}
                        </span>
                      </td>
                      <td className="num">{eur(c.budget)}</td>
                      <td className="num">{eur(c.totals.spend)}</td>
                      <td className="num">{num(c.totals.impressions)}</td>
                      <td className="num">{num(c.totals.clicks)}</td>
                      <td className="num">{pct(c.totals.ctr)}</td>
                      <td className="num">
                        {c.totals.clicks > 0
                          ? eur(c.totals.spend / c.totals.clicks)
                          : "—"}
                      </td>
                      <td className="num">{num(c.totals.conversions)}</td>
                      <td className="num">{pct(c.totals.cvr)}</td>
                      <td className="num">
                        {c.totals.conversions > 0 ? eur(c.totals.cpa) : "—"}
                      </td>
                      <td className="num">
                        {c.totals.spend > 0
                          ? `${c.totals.roas.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}×`
                          : "—"}
                      </td>
                      <td>
                        {c.status !== "ended" && (
                          <button
                            className="btn btn-sm"
                            onClick={() => toggleStatus(c)}
                          >
                            {c.status === "active" ? "Pause" : "Reprendre"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <CampaignForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            setToast("Campagne créée — diffusion en cours.");
            load();
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function CampaignForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [topic, setTopic] = useState<Topic>("tech");
  const [targets, setTargets] = useState<LLMTarget[]>(["claude", "chatgpt"]);
  const [budget, setBudget] = useState("5000");
  const [cpc, setCpc] = useState("0.80");
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [cta, setCta] = useState("Découvrir");
  const [url, setUrl] = useState("https://");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTarget = (t: LLMTarget) => {
    setTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          advertiser,
          topic,
          targets,
          budget: Number(budget.replace(",", ".")),
          cpc: Number(cpc.replace(",", ".")),
          headline,
          body: bodyText,
          cta,
          url,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erreur lors de la création.");
        setSubmitting(false);
        return;
      }
      onCreated();
    } catch {
      setError("Erreur réseau.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h2>Nouvelle campagne</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="f-name">Nom de la campagne</label>
              <input
                id="f-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lancement produit — Q3"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="f-adv">Annonceur</label>
              <input
                id="f-adv"
                value={advertiser}
                onChange={(e) => setAdvertiser(e.target.value)}
                placeholder="Votre marque"
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Diffusion sur</label>
            <div className="chip-row">
              {ALL_LLMS.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`chip ${targets.includes(t) ? "selected" : ""}`}
                  onClick={() => toggleTarget(t)}
                >
                  {LLM_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="f-topic">Thématique</label>
              <select
                id="f-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
              >
                {ALL_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {TOPIC_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-budget">Budget (€)</label>
              <input
                id="f-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                inputMode="decimal"
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="f-cpc">CPC max (€)</label>
              <input
                id="f-cpc"
                value={cpc}
                onChange={(e) => setCpc(e.target.value)}
                inputMode="decimal"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="f-cta">Texte du bouton (CTA)</label>
              <input
                id="f-cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="f-headline">Accroche</label>
            <input
              id="f-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Votre message principal"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="f-body">Description (optionnelle)</label>
            <textarea
              id="f-body"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={2}
            />
          </div>

          <div className="field">
            <label htmlFor="f-url">URL de destination</label>
            <input
              id="f-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || targets.length === 0}
            >
              {submitting ? "Création…" : "Lancer la campagne"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
