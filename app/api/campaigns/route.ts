import { NextResponse } from "next/server";
import { addCampaign, getCampaignsWithMetrics } from "@/lib/store";
import { ALL_LLMS, ALL_TOPICS, LLMTarget, Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/campaigns — liste des campagnes avec métriques agrégées. */
export async function GET() {
  return NextResponse.json({ campaigns: getCampaignsWithMetrics() });
}

/** POST /api/campaigns — création d'une campagne. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corps JSON invalide." },
      { status: 400 }
    );
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const advertiser =
    typeof input.advertiser === "string" ? input.advertiser.trim() : "";
  const topic = input.topic as Topic;
  const targets = Array.isArray(input.targets)
    ? (input.targets.filter((t) =>
        (ALL_LLMS as string[]).includes(t as string)
      ) as LLMTarget[])
    : [];
  const budget = Number(input.budget);
  const cpc = Number(input.cpc);
  const headline =
    typeof input.headline === "string" ? input.headline.trim() : "";
  const bodyText = typeof input.body === "string" ? input.body.trim() : "";
  const cta = typeof input.cta === "string" ? input.cta.trim() : "";
  const url = typeof input.url === "string" ? input.url.trim() : "";

  const errors: string[] = [];
  if (!name) errors.push("name");
  if (!advertiser) errors.push("advertiser");
  if (!(ALL_TOPICS as string[]).includes(topic as string)) errors.push("topic");
  if (targets.length === 0) errors.push("targets");
  if (!Number.isFinite(budget) || budget <= 0) errors.push("budget");
  if (!Number.isFinite(cpc) || cpc <= 0) errors.push("cpc");
  if (!headline) errors.push("headline");
  if (!cta) errors.push("cta");
  if (!url || !/^https?:\/\//.test(url)) errors.push("url");

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Champs invalides : ${errors.join(", ")}.` },
      { status: 400 }
    );
  }

  const campaign = addCampaign({
    name,
    advertiser,
    topic,
    targets,
    budget,
    cpc,
    headline,
    body: bodyText,
    cta,
    url,
  });

  return NextResponse.json({ ok: true, campaign }, { status: 201 });
}
