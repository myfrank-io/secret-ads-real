import { NextResponse } from "next/server";
import { serveAd } from "@/lib/store";
import { ALL_TOPICS, PAYOUTS, Topic } from "@/lib/types";

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
 * Connecteur Secret Ads — endpoint de diffusion.
 *
 * GET /api/ads?llm=claude&topics=tech,voyage
 * Renvoie une publicité adaptée au LLM hôte et aux centres d'intérêt
 * de l'utilisateur, à afficher dans la barre de chargement.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const llm = searchParams.get("llm") ?? undefined;
  const topicsParam = searchParams.get("topics");
  const topics = topicsParam
    ? (topicsParam
        .split(",")
        .map((t) => t.trim())
        .filter((t): t is Topic =>
          (ALL_TOPICS as string[]).includes(t)
        ) as Topic[])
    : undefined;

  const ad = serveAd({ llm, topics });

  if (!ad) {
    return NextResponse.json(
      { ad: null, error: "Aucune campagne active ne correspond." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

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
