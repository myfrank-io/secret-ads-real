"use client";

import { useState } from "react";
import LoadingBarAd from "@/components/LoadingBarAd";
import {
  ALL_LLMS,
  ALL_TOPICS,
  LLM_LABELS,
  LLMTarget,
  ServedAd,
  TOPIC_LABELS,
  Topic,
} from "@/lib/types";

export default function ConnectorPlayground() {
  const [llm, setLlm] = useState<LLMTarget>("claude");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [ad, setAd] = useState<ServedAd | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (t: Topic) => {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const serve = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ llm });
      if (topics.length > 0) params.set("topics", topics.join(","));
      const res = await fetch(`/api/ads?${params.toString()}`);
      const json = (await res.json()) as {
        ad: ServedAd | null;
        error?: string;
      };
      setAd(json.ad ?? null);
      setRaw(JSON.stringify(json, null, 2));
      setRunId((r) => r + 1);
      if (!res.ok) {
        setError(json.error ?? "Requête invalide.");
      } else if (!json.ad) {
        setError(
          "Aucune campagne active ne cible ce LLM — le ciblage LLM est strict."
        );
      }
    } catch {
      setError("Erreur réseau.");
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="card-title">Tester le connecteur en direct</div>

      <div className="field">
        <label>LLM hôte</label>
        <div className="chip-row">
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
      </div>

      <div className="field">
        <label>Centres d&apos;intérêt (optionnel)</label>
        <div className="chip-row">
          {ALL_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${topics.includes(t) ? "selected" : ""}`}
              onClick={() => toggleTopic(t)}
            >
              {TOPIC_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={serve} disabled={loading}>
        {loading ? "Requête en cours…" : "GET /api/ads"}
      </button>

      {error && <p className="form-error" style={{ marginTop: "0.9rem" }}>{error}</p>}

      {raw && (
        <>
          <div className="spacer" />
          {ad && (
            <>
              <LoadingBarAd
                key={runId}
                llmLabel={LLM_LABELS[llm]}
                prompt="Compare-moi les 3 meilleures options, avec un tableau"
                ad={ad}
                durationMs={6000}
                loop
              />
              <div className="spacer" />
            </>
          )}
          <pre className="codeblock">{raw}</pre>
        </>
      )}
    </div>
  );
}
