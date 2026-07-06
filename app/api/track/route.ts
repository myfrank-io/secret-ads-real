import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/store";
import { PAYOUTS, TrackEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const VALID_EVENTS: TrackEvent[] = ["impression", "click", "conversion"];

/**
 * Connecteur Secret Ads — endpoint de tracking.
 *
 * POST /api/track { campaignId: string, event: "impression" | "click" | "conversion" }
 * Enregistre l'événement côté annonceur et renvoie la rémunération
 * créditée à l'utilisateur.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corps JSON invalide." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { campaignId, event } = (body ?? {}) as {
    campaignId?: unknown;
    event?: unknown;
  };

  if (
    typeof campaignId !== "string" ||
    campaignId.length === 0 ||
    campaignId.length > 100 ||
    typeof event !== "string" ||
    !VALID_EVENTS.includes(event as TrackEvent)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Paramètres requis : campaignId (string) et event (impression | click | conversion).",
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const result = trackEvent(campaignId, event as TrackEvent);
  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json(
        { ok: false, error: "Campagne introuvable." },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Campagne inactive ou budget épuisé." },
      { status: 409, headers: CORS_HEADERS }
    );
  }

  const earned =
    event === "impression"
      ? PAYOUTS.impression
      : event === "click"
        ? PAYOUTS.click
        : PAYOUTS.conversionCashback;

  return NextResponse.json({ ok: true, earned }, { headers: CORS_HEADERS });
}
