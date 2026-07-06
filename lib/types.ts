export type LLMTarget = "claude" | "chatgpt" | "gemini" | "mistral" | "perplexity";

export type Topic =
  | "tech"
  | "voyage"
  | "mode"
  | "food"
  | "finance"
  | "gaming"
  | "sport"
  | "beaute";

export type CampaignStatus = "active" | "paused" | "ended";

export interface Campaign {
  id: string;
  name: string;
  advertiser: string;
  topic: Topic;
  targets: LLMTarget[];
  status: CampaignStatus;
  budget: number; // EUR
  cpc: number; // EUR par clic
  headline: string;
  body: string;
  cta: string;
  url: string;
  color: string;
  createdAt: string; // ISO date
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number; // EUR
  revenue: number; // EUR générés côté annonceur
}

export interface CampaignWithMetrics extends Campaign {
  daily: DailyMetric[];
  totals: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number; // %
    cvr: number; // %
    cpa: number; // EUR
    roas: number; // x
  };
}

export interface ServedAd {
  id: string;
  campaignId: string;
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  url: string;
  color: string;
  topic: Topic;
}

export type TrackEvent = "impression" | "click" | "conversion";

export const LLM_LABELS: Record<LLMTarget, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  mistral: "Mistral",
  perplexity: "Perplexity",
};

export const TOPIC_LABELS: Record<Topic, string> = {
  tech: "Tech",
  voyage: "Voyage",
  mode: "Mode",
  food: "Food",
  finance: "Finance",
  gaming: "Gaming",
  sport: "Sport",
  beaute: "Beauté",
};

export const ALL_LLMS: LLMTarget[] = [
  "claude",
  "chatgpt",
  "gemini",
  "mistral",
  "perplexity",
];

export const ALL_TOPICS: Topic[] = [
  "tech",
  "voyage",
  "mode",
  "food",
  "finance",
  "gaming",
  "sport",
  "beaute",
];

// Rémunération côté utilisateur
export const PAYOUTS = {
  impression: 0.05,
  click: 0.25,
  conversionCashback: 1.5,
} as const;

export const CASHOUT_THRESHOLD = 10;
