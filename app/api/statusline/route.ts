import { NextResponse } from "next/server";
import { creditWallet, serveAd, trackEvent } from "@/lib/store";
import { ALL_LLMS, LLMTarget } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Connecteur Permile — format « status line » pour IDE et terminaux
 * (Claude Code, Cursor…). Renvoie UNE ligne de texte brut, prête à
 * afficher dans une barre de statut.
 *
 * GET /api/statusline?llm=claude-code&uid=usr_xxx
 * → "▌ Sentry — Le code généré par l'IA casse aussi · sentry.io"
 *
 * L'impression est créditée sur le portefeuille du uid à chaque
 * affichage servi (le client doit s'auto-limiter, voir statusline.sh).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const llmParam = (searchParams.get("llm") ?? "claude-code")
    .trim()
    .toLowerCase();
  const llm: LLMTarget = (ALL_LLMS as string[]).includes(llmParam)
    ? (llmParam as LLMTarget)
    : "claude-code";

  const uidParam = searchParams.get("uid");
  const uid =
    uidParam && /^[\w-]{1,64}$/.test(uidParam) ? uidParam : undefined;

  const ad = serveAd({ llm });
  if (!ad) {
    return new NextResponse("", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  trackEvent(ad.campaignId, "impression");
  if (uid) creditWallet(uid, "impression");

  const host = ad.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
  const line = `▌ ${ad.advertiser} — ${ad.headline} · ${host}`;

  return new NextResponse(line, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
