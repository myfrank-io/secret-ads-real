import { NextResponse } from "next/server";
import { addCampaign, getCampaignsWithMetrics } from "@/lib/store";
import { ALL_LLMS, ALL_TOPICS, LIMITS, LLMTarget, Topic } from "@/lib/types";

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
    ? (Array.from(
        new Set(
          input.targets.filter((t) =>
            (ALL_LLMS as string[]).includes(t as string)
          )
        )
      ) as LLMTarget[])
    : [];
  const budget = Number(input.budget);
  const cpc = Number(input.cpc);
  const headline =
    typeof input.headline === "string" ? input.headline.trim() : "";
  const bodyText = typeof input.body === "string" ? input.body.trim() : "";
  const cta = typeof input.cta === "string" ? input.cta.trim() : "";
  const url = typeof input.url === "string" ? input.url.trim() : "";

  const isValidUrl = (u: string): boolean => {
    if (u.length > LIMITS.url || !/^https?:\/\//i.test(u)) return false;
    try {
      const parsed = new URL(u);
      return parsed.hostname.length > 0;
    } catch {
      return false;
    }
  };

  const errors: string[] = [];
  if (!name || name.length > LIMITS.name) errors.push("name");
  if (!advertiser || advertiser.length > LIMITS.advertiser)
    errors.push("advertiser");
  if (!(ALL_TOPICS as string[]).includes(topic as string)) errors.push("topic");
  if (targets.length === 0) errors.push("targets");
  if (!Number.isFinite(budget) || budget <= 0 || budget > LIMITS.maxBudget)
    errors.push("budget");
  if (!Number.isFinite(cpc) || cpc <= 0 || cpc > LIMITS.maxCpc || cpc > budget)
    errors.push("cpc");
  if (!headline || headline.length > LIMITS.headline) errors.push("headline");
  if (bodyText.length > LIMITS.body) errors.push("body");
  if (!cta || cta.length > LIMITS.cta) errors.push("cta");
  if (!isValidUrl(url)) errors.push("url");

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

  if (!campaign) {
    return NextResponse.json(
      { ok: false, error: "Limite de campagnes atteinte pour cette démo." },
      { status: 429 }
    );
  }

  return NextResponse.json({ ok: true, campaign }, { status: 201 });
}
