export type LLMTarget =
  | "claude"
  | "chatgpt"
  | "gemini"
  | "mistral"
  | "perplexity"
  | "claude-code"
  | "cursor";

export type Topic =
  | "tech"
  | "devtools"
  | "cloud"
  | "ia"
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
  "claude-code": "Claude Code",
  cursor: "Cursor",
};

export const TOPIC_LABELS: Record<Topic, string> = {
  tech: "Tech",
  devtools: "Dev tools",
  cloud: "Cloud",
  ia: "IA",
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
  "claude-code",
  "cursor",
];

export const ALL_TOPICS: Topic[] = [
  "tech",
  "devtools",
  "cloud",
  "ia",
  "voyage",
  "mode",
  "food",
  "finance",
  "gaming",
  "sport",
  "beaute",
];

// Portefeuille serveur d'un utilisateur du connecteur (identifié par uid)
export interface Wallet {
  balance: number;
  lifetime: number;
  views: number;
  clicks: number;
}

// Rémunération côté utilisateur
export const PAYOUTS = {
  impression: 0.05,
  click: 0.25,
  conversionCashback: 1.5,
} as const;

export const CASHOUT_THRESHOLD = 10;

// Valeur créditée côté annonceur lors d'une conversion trackée
export const AVG_ORDER_VALUE = 80;

// Bornes de validation des campagnes (anti-abus, l'API est ouverte en MVP)
export const LIMITS = {
  name: 80,
  advertiser: 60,
  headline: 120,
  body: 300,
  cta: 40,
  url: 2048,
  maxBudget: 1_000_000,
  maxCpc: 100,
  maxCampaigns: 200,
} as const;
