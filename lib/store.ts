import {
  AVG_ORDER_VALUE,
  Campaign,
  CampaignWithMetrics,
  DailyMetric,
  LIMITS,
  LLMTarget,
  PAYOUTS,
  ServedAd,
  Topic,
  TrackEvent,
  Wallet,
} from "./types";

// Générateur pseudo-aléatoire déterministe (les métriques de démo sont stables)
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Frontière de journée en UTC partout (labels et tracking cohérents,
// insensible au fuseau du serveur et aux changements d'heure)
function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp_notion",
    name: "Notion AI — Lancement Q3",
    advertiser: "Notion",
    topic: "tech",
    targets: ["claude", "chatgpt", "gemini"],
    status: "active",
    budget: 12000,
    cpc: 0.85,
    headline: "Notion AI organise vos idées pendant que l'IA réfléchit",
    body: "Essayez l'espace de travail tout-en-un préféré des équipes produit.",
    cta: "Essayer gratuitement",
    url: "https://www.notion.so",
    color: "#3987e5",
    createdAt: dateNDaysAgo(30),
  },
  {
    id: "cmp_airfrance",
    name: "Air France — Été 2026",
    advertiser: "Air France",
    topic: "voyage",
    targets: ["chatgpt", "gemini", "perplexity"],
    status: "active",
    budget: 25000,
    cpc: 1.2,
    headline: "Tokyo dès 512 € A/R — vos vacances décollent",
    body: "Réservez avant le 31 juillet et cumulez des miles doublés.",
    cta: "Voir les vols",
    url: "https://www.airfrance.fr",
    color: "#199e70",
    createdAt: dateNDaysAgo(24),
  },
  {
    id: "cmp_backmarket",
    name: "Back Market — Rentrée reconditionnée",
    advertiser: "Back Market",
    topic: "tech",
    targets: ["claude", "mistral"],
    status: "active",
    budget: 8000,
    cpc: 0.6,
    headline: "Un MacBook reconditionné à -40 %, garanti 2 ans",
    body: "La tech premium sans le prix du neuf, vérifiée par des pros.",
    cta: "J'en profite",
    url: "https://www.backmarket.fr",
    color: "#c98500",
    createdAt: dateNDaysAgo(18),
  },
  {
    id: "cmp_qonto",
    name: "Qonto — Compte pro freelances",
    advertiser: "Qonto",
    topic: "finance",
    targets: ["claude", "chatgpt", "mistral", "perplexity"],
    status: "active",
    budget: 15000,
    cpc: 2.1,
    headline: "Votre compte pro ouvert en 10 minutes, sans paperasse",
    body: "3 mois offerts pour les freelances qui se lancent.",
    cta: "Ouvrir mon compte",
    url: "https://qonto.com",
    color: "#9085e9",
    createdAt: dateNDaysAgo(14),
  },
  {
    id: "cmp_decathlon",
    name: "Decathlon — Trail Series",
    advertiser: "Decathlon",
    topic: "sport",
    targets: ["gemini", "chatgpt"],
    status: "paused",
    budget: 6000,
    cpc: 0.45,
    headline: "Équipez-vous pour votre premier trail à moins de 120 €",
    body: "Chaussures, sac, bâtons : le pack complet testé en montagne.",
    cta: "Découvrir le pack",
    url: "https://www.decathlon.fr",
    color: "#e66767",
    createdAt: dateNDaysAgo(40),
  },
];

const DAYS_OF_HISTORY = 30;

// Couleurs attribuées aux nouvelles campagnes (palette validée surface sombre)
const CAMPAIGN_COLORS = [
  "#3987e5",
  "#199e70",
  "#c98500",
  "#9085e9",
  "#e66767",
  "#d55181",
  "#d95926",
];

function generateDaily(campaign: Campaign, seed: number): DailyMetric[] {
  const rand = mulberry32(seed);
  const daily: DailyMetric[] = [];
  const scale = campaign.budget / 10000; // les gros budgets font plus de volume
  let spentSoFar = 0;
  for (let i = DAYS_OF_HISTORY - 1; i >= 0; i--) {
    const noise = 0.8 + 0.4 * rand();
    const impressions = Math.round((2000 + rand() * 6000) * scale * noise);
    const ctr = 0.025 + rand() * 0.03;
    // La dépense seedée s'arrête à 90 % du budget : les campagnes de démo
    // gardent de la marge et ne naissent pas épuisées (fin au premier clic)
    const spendCap = campaign.budget * 0.9;
    const affordable = Math.max(
      0,
      Math.floor((spendCap - spentSoFar) / campaign.cpc)
    );
    const clicks = Math.min(Math.round(impressions * ctr), affordable);
    const cvr = 0.04 + rand() * 0.06;
    const conversions = Math.round(clicks * cvr);
    const spend = Math.round(clicks * campaign.cpc * 100) / 100;
    spentSoFar += spend;
    const aov = 45 + rand() * 120; // panier moyen
    const revenue = Math.round(conversions * aov * 100) / 100;
    daily.push({
      date: dateNDaysAgo(i),
      impressions,
      clicks,
      conversions,
      spend,
      revenue,
    });
  }
  return daily;
}

interface Store {
  campaigns: Campaign[];
  metrics: Map<string, DailyMetric[]>;
  wallets: Map<string, Wallet>;
  seq: number;
}

function createStore(): Store {
  const metrics = new Map<string, DailyMetric[]>();
  // Copies profondes : les seeds du module ne sont jamais mutés
  const campaigns = SEED_CAMPAIGNS.map((c) => ({
    ...c,
    targets: [...c.targets],
  }));
  campaigns.forEach((c, idx) => {
    metrics.set(c.id, generateDaily(c, 1000 + idx * 97));
  });
  return { campaigns, metrics, wallets: new Map(), seq: 0 };
}

// Persiste entre les requêtes d'une même instance (dev + serverless chaude).
// Limite assumée du MVP : chaque instance serverless a son propre store.
const globalStore = globalThis as unknown as { __permileStore?: Store };

export function getStore(): Store {
  if (!globalStore.__permileStore) {
    globalStore.__permileStore = createStore();
  }
  return globalStore.__permileStore;
}

function computeTotals(daily: DailyMetric[]) {
  const sum = daily.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      conversions: acc.conversions + d.conversions,
      spend: acc.spend + d.spend,
      revenue: acc.revenue + d.revenue,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
  );
  return {
    ...sum,
    ctr: sum.impressions > 0 ? (sum.clicks / sum.impressions) * 100 : 0,
    cvr: sum.clicks > 0 ? (sum.conversions / sum.clicks) * 100 : 0,
    cpa: sum.conversions > 0 ? sum.spend / sum.conversions : 0,
    roas: sum.spend > 0 ? sum.revenue / sum.spend : 0,
  };
}

export function getCampaignsWithMetrics(): CampaignWithMetrics[] {
  const store = getStore();
  return store.campaigns.map((c) => {
    const daily = store.metrics.get(c.id) ?? [];
    return { ...c, daily: daily.map((d) => ({ ...d })), totals: computeTotals(daily) };
  });
}

export function addCampaign(input: {
  name: string;
  advertiser: string;
  topic: Topic;
  targets: LLMTarget[];
  budget: number;
  cpc: number;
  headline: string;
  body: string;
  cta: string;
  url: string;
}): Campaign | null {
  const store = getStore();
  if (store.campaigns.length >= LIMITS.maxCampaigns) {
    return null;
  }
  store.seq += 1;
  // Les champs serveur sont posés APRÈS le spread : un input hostile ne peut
  // pas fournir id/status/createdAt
  const campaign: Campaign = {
    ...input,
    id: `cmp_${Date.now().toString(36)}_${store.seq}`,
    status: "active",
    color: CAMPAIGN_COLORS[store.seq % CAMPAIGN_COLORS.length],
    createdAt: dateNDaysAgo(0),
  };
  store.campaigns.unshift(campaign);
  // Une nouvelle campagne démarre à zéro : une seule journée vide (aujourd'hui)
  store.metrics.set(campaign.id, [
    {
      date: dateNDaysAgo(0),
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
    },
  ]);
  return campaign;
}

export function setCampaignStatus(
  id: string,
  status: Campaign["status"]
): Campaign | null {
  const store = getStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  if (!campaign) return null;
  campaign.status = status;
  return campaign;
}

/**
 * Sélectionne une pub pour la barre de chargement.
 * - Ciblage LLM strict : une campagne qui ne cible pas le LLM hôte n'est
 *   jamais servie (contrat annonceur).
 * - Ciblage topics au mieux : on privilégie les centres d'intérêt de
 *   l'utilisateur, avec repli sur le pool restant pour garder un bon fill rate.
 */
export function serveAd(params: {
  llm?: LLMTarget;
  topics?: Topic[];
}): ServedAd | null {
  const store = getStore();
  let pool = store.campaigns.filter((c) => c.status === "active");
  if (params.llm) {
    pool = pool.filter((c) => c.targets.includes(params.llm as LLMTarget));
  }
  if (pool.length === 0) return null;
  if (params.topics && params.topics.length > 0) {
    const byTopic = pool.filter((c) => params.topics!.includes(c.topic));
    if (byTopic.length > 0) pool = byTopic;
  }
  const campaign = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: `ad_${campaign.id}_${Date.now().toString(36)}`,
    campaignId: campaign.id,
    advertiser: campaign.advertiser,
    headline: campaign.headline,
    body: campaign.body,
    cta: campaign.cta,
    url: campaign.url,
    color: campaign.color,
    topic: campaign.topic,
  };
}

export type TrackResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "inactive" };

export function trackEvent(campaignId: string, event: TrackEvent): TrackResult {
  const store = getStore();
  const campaign = store.campaigns.find((c) => c.id === campaignId);
  if (!campaign) return { ok: false, reason: "not_found" };
  // Une campagne en pause ou terminée ne peut plus être facturée
  if (campaign.status !== "active") return { ok: false, reason: "inactive" };
  const daily = store.metrics.get(campaignId);
  if (!daily || daily.length === 0) return { ok: false, reason: "not_found" };
  const today = dateNDaysAgo(0);
  let entry = daily[daily.length - 1];
  if (entry.date !== today) {
    entry = {
      date: today,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
    };
    daily.push(entry);
  }
  if (event === "impression") entry.impressions += 1;
  if (event === "click") {
    const totalSpend = daily.reduce((s, d) => s + d.spend, 0);
    if (totalSpend + campaign.cpc > campaign.budget) {
      // Budget épuisé : la campagne s'arrête d'elle-même
      campaign.status = "ended";
      return { ok: false, reason: "inactive" };
    }
    entry.clicks += 1;
    entry.spend = Math.round((entry.spend + campaign.cpc) * 100) / 100;
  }
  if (event === "conversion") {
    entry.conversions += 1;
    entry.revenue = Math.round((entry.revenue + AVG_ORDER_VALUE) * 100) / 100;
  }
  return { ok: true };
}

const MAX_WALLETS = 10000;

const EMPTY_WALLET: Wallet = { balance: 0, lifetime: 0, views: 0, clicks: 0 };

/**
 * Crédite le portefeuille serveur d'un utilisateur du connecteur.
 * Le uid vient du snippet SDK installé par l'utilisateur sur son LLM.
 */
export function creditWallet(uid: string, event: TrackEvent): Wallet {
  const store = getStore();
  const existing = store.wallets.get(uid);
  if (!existing && store.wallets.size >= MAX_WALLETS) {
    // Plafond anti-abus : on répond sans persister de nouveau portefeuille
    return { ...EMPTY_WALLET };
  }
  const wallet = existing ?? { ...EMPTY_WALLET };
  const amount =
    event === "impression"
      ? PAYOUTS.impression
      : event === "click"
        ? PAYOUTS.click
        : PAYOUTS.conversionCashback;
  wallet.balance = Math.round((wallet.balance + amount) * 100) / 100;
  wallet.lifetime = Math.round((wallet.lifetime + amount) * 100) / 100;
  if (event === "impression") wallet.views += 1;
  if (event === "click") wallet.clicks += 1;
  store.wallets.set(uid, wallet);
  return { ...wallet };
}

export function getWallet(uid: string): Wallet {
  const store = getStore();
  const wallet = store.wallets.get(uid);
  return wallet ? { ...wallet } : { ...EMPTY_WALLET };
}
