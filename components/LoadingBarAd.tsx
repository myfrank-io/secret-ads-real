"use client";

import { useEffect, useRef, useState } from "react";
import { ServedAd } from "@/lib/types";

interface Props {
  llmLabel: string;
  prompt: string;
  ad: ServedAd | null;
  durationMs?: number;
  loop?: boolean;
  onComplete?: () => void;
  onAdClick?: (ad: ServedAd) => void;
}

/**
 * Reproduit l'interface d'un LLM pendant la génération : le prompt de
 * l'utilisateur, l'emplacement publicitaire Secret Ads, et la barre de
 * progression de la réponse. Remonter avec une `key` différente pour
 * relancer une session.
 */
export default function LoadingBarAd({
  llmLabel,
  prompt,
  ad,
  durationMs = 5000,
  loop = false,
  onComplete,
  onAdClick,
}: Props) {
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    completedRef.current = false;
    setProgress(0);
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      if (loop) {
        setProgress(((elapsed / durationMs) * 100) % 100);
        return;
      }
      setProgress(pct);
      if (pct >= 100 && !completedRef.current) {
        completedRef.current = true;
        clearInterval(timer);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 80);
    return () => clearInterval(timer);
  }, [durationMs, loop]);

  const done = !loop && progress >= 100;

  return (
    <div className="llm-frame">
      <div className="llm-frame-head">
        <span
          className="dot"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: done ? "var(--good)" : "var(--warning)",
            display: "inline-block",
          }}
        />
        {llmLabel} — {done ? "réponse générée" : "génération en cours…"}
      </div>
      <div className="llm-frame-body">
        <div className="llm-prompt">{prompt}</div>

        {ad ? (
          <div className="ad-slot">
            <div className="ad-logo" style={{ background: ad.color }}>
              {ad.advertiser.charAt(0)}
            </div>
            <div className="ad-content">
              <div className="ad-sponsor">Sponsorisé · {ad.advertiser}</div>
              <div className="ad-headline">{ad.headline}</div>
              {ad.body ? <div className="ad-body">{ad.body}</div> : null}
              <div className="ad-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (onAdClick) onAdClick(ad);
                  }}
                >
                  {ad.cta}
                </button>
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

        <div className="progress-row">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
          <span style={{ minWidth: 38, textAlign: "right" }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}
