import { NextResponse } from "next/server";
import { setCampaignStatus } from "@/lib/store";
import { CampaignStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_STATUSES: CampaignStatus[] = ["active", "paused", "ended"];

/** PATCH /api/campaigns/:id — met à jour le statut (pause / reprise). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corps JSON invalide." },
      { status: 400 }
    );
  }

  const { status } = (body ?? {}) as { status?: string };
  if (!status || !VALID_STATUSES.includes(status as CampaignStatus)) {
    return NextResponse.json(
      { ok: false, error: "status requis : active | paused | ended." },
      { status: 400 }
    );
  }

  const campaign = setCampaignStatus(id, status as CampaignStatus);
  if (!campaign) {
    return NextResponse.json(
      { ok: false, error: "Campagne introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, campaign });
}
