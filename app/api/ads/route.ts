import { NextResponse } from "next/server";
import { serveAd } from "@/lib/store";
import { ALL_LLMS, ALL_TOPICS, LLMTarget, PAYOUTS, Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Connecteur Permile — endpoint de diffusion.
 *
 * GET /api/ads?llm=claude&topics=tech,voyage
 * Renvoie une publicité adaptée au LLM hôte et aux centres d'intérêt
 * de l'utilisateur, à afficher dans la barre de chargement.
 *
 * Contrat : le ciblage LLM est strict (une campagne qui ne cible pas ce LLM
 * n'est jamais servie) ; les topics sont un ciblage préférentiel. Un "no
 * fill" est une réponse normale : 200 avec { ad: null }.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const llmParam = searchParams.get("llm");
  let llm: LLMTarget | undefined;
  // Chaîne vide = paramètre absent (pas d'erreur)
  if (llmParam !== null && llmParam.trim() !== "") {
    const normalized = llmParam.trim().toLowerCase();
    if (!(ALL_LLMS as string[]).includes(normalized)) {
      return NextResponse.json(
        {
          ad: null,
          error: `Paramètre llm invalide. Valeurs acceptées : ${ALL_LLMS.join(", ")}.`,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    llm = normalized as LLMTarget;
  }

  const topicsParam = searchParams.get("topics");
  const topics = topicsParam
    ? (topicsParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t): t is Topic =>
          (ALL_TOPICS as string[]).includes(t)
        ) as Topic[])
    : undefined;

  const ad = serveAd({ llm, topics });

  return NextResponse.json(
    {
      ad,
      meta: {
        format: "loading-bar",
        payouts: PAYOUTS,
        track: "/api/track",
      },
    },
    { headers: CORS_HEADERS }
  );
}
