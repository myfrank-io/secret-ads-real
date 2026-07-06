import { ALL_TOPICS, Topic } from "./types";

/**
 * État des gains côté utilisateur, partagé entre /earn (tableau de bord) et
 * /demo (LLM simulé avec le connecteur installé). Persisté en localStorage.
 */

export const STORAGE_KEY = "secret-ads-earn-v1";
export const UID_KEY = "secret-ads-uid";

export interface EarnEvent {
  id: string;
  ts: number;
  type: "impression" | "click" | "conversion" | "cashout";
  label: string;
  amount: number; // négatif pour un retrait
}

export interface EarnState {
  topics: Topic[];
  balance: number;
  lifetime: number;
  views: number;
  clicks: number;
  history: EarnEvent[];
}

export const EMPTY_EARN_STATE: EarnState = {
  topics: [],
  balance: 0,
  lifetime: 0,
  views: 0,
  clicks: 0,
  history: [],
};

export function loadEarnState(): EarnState {
  if (typeof window === "undefined") return EMPTY_EARN_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_EARN_STATE;
    const parsed = JSON.parse(raw) as Partial<EarnState>;
    const history = Array.isArray(parsed.history)
      ? (parsed.history as Partial<EarnEvent>[]).map((h, i) => ({
          id: typeof h.id === "string" ? h.id : `legacy-${i}-${h.ts ?? i}`,
          ts: typeof h.ts === "number" ? h.ts : 0,
          type: (h.type ?? "impression") as EarnEvent["type"],
          label: typeof h.label === "string" ? h.label : "",
          amount: typeof h.amount === "number" ? h.amount : 0,
        }))
      : [];
    return {
      topics: Array.isArray(parsed.topics)
        ? (parsed.topics.filter((t) =>
            (ALL_TOPICS as string[]).includes(t as string)
          ) as Topic[])
        : [],
      balance: typeof parsed.balance === "number" ? parsed.balance : 0,
      lifetime: typeof parsed.lifetime === "number" ? parsed.lifetime : 0,
      views: typeof parsed.views === "number" ? parsed.views : 0,
      clicks: typeof parsed.clicks === "number" ? parsed.clicks : 0,
      history,
    };
  } catch {
    return EMPTY_EARN_STATE;
  }
}

export function saveEarnState(state: EarnState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : l'app reste utilisable sans persistance
  }
}

/**
 * Identifiant personnel de l'utilisateur (embarqué dans le snippet SDK pour
 * que les gains remontent sur son portefeuille, quel que soit le site hôte).
 */
export function getOrCreateUid(): string {
  if (typeof window === "undefined") return "usr_ssr";
  try {
    const existing = window.localStorage.getItem(UID_KEY);
    if (existing && /^[\w-]{1,64}$/.test(existing)) return existing;
    const uid = `usr_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
    window.localStorage.setItem(UID_KEY, uid);
    return uid;
  } catch {
    return "usr_anon";
  }
}
