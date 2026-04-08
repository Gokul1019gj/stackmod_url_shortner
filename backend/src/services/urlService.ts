import geoip from "geoip-lite";
import { generateShortCode } from "../utils/shortCode";
import {
  findByShortCode,
  shortCodeExists,
  insertUrl,
  listByUser,
  softDelete,
  recordClick,
  getStats,
  getTopUrls,
  getDailyTrend,
  getBotSuspects,
  UrlRow,
  UrlStats,
  TopUrlRow,
  DailyTrendRow,
  BotSuspectRow,
  getGlobalClicksByCountry,
} from "../repositories/urlRepository";
import { ensureUser } from "../repositories/userRepository";

const ALIAS_REGEX = /^[a-zA-Z0-9-]{4,20}$/;

// ── Shorten ──────────────────────────────────────────────────────────────────

export interface ShortenInput {
  original_url: unknown;
  custom_alias: unknown;
  expires_at: unknown;
  userId: string | null;
}

export interface ShortenResult {
  short_code: string;
  original_url: string;
  expires_at: string | null;
  created_at: string;
}

export type ShortenError =
  | { code: "MISSING_URL" }
  | { code: "INVALID_URL" }
  | { code: "INVALID_ALIAS" }
  | { code: "ALIAS_TAKEN"; alias: string }
  | { code: "INVALID_EXPIRES" }
  | { code: "EXPIRES_IN_PAST" };

export function shortenUrl(input: ShortenInput): ShortenResult | ShortenError {
  const { original_url, custom_alias, expires_at, userId } = input;

  if (!original_url || typeof original_url !== "string") {
    return { code: "MISSING_URL" };
  }

  try {
    const parsed = new URL(original_url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return { code: "INVALID_URL" };
  }

  if (custom_alias !== undefined) {
    if (typeof custom_alias !== "string" || !ALIAS_REGEX.test(custom_alias)) {
      return { code: "INVALID_ALIAS" };
    }
  }

  let expiresAtIso: string | null = null;
  if (expires_at !== undefined) {
    const expDate = new Date(expires_at as string);
    if (isNaN(expDate.getTime())) return { code: "INVALID_EXPIRES" };
    // Set to the end of the selected day to allow choosing today's date natively
    expDate.setUTCHours(23, 59, 59, 999);
    if (expDate <= new Date()) return { code: "EXPIRES_IN_PAST" };
    expiresAtIso = expDate.toISOString();
  }

  let shortCode: string;
  if (custom_alias) {
    if (shortCodeExists(custom_alias as string)) {
      return { code: "ALIAS_TAKEN", alias: custom_alias as string };
    }
    shortCode = custom_alias as string;
  } else {
    shortCode = generateShortCode(shortCodeExists);
  }

  if (userId) ensureUser(userId);
  insertUrl(shortCode, original_url, userId, expiresAtIso);

  return {
    short_code: shortCode,
    original_url,
    expires_at: expiresAtIso,
    created_at: new Date().toISOString(),
  };
}

// ── Resolve & Track ───────────────────────────────────────────────────────────

export type ResolveResult =
  | { status: "ok"; original_url: string }
  | { status: "not_found" }
  | { status: "expired" };

export function resolveAndTrack(
  shortCode: string,
  ip: string | null,
  country: string | null,
  userAgent: string | null,
): ResolveResult {
  const url = findByShortCode(shortCode);

  if (!url || !url.is_active) return { status: "not_found" };
  if (url.expires_at && new Date(url.expires_at) <= new Date())
    return { status: "expired" };

  // If country is missing (not provided by proxy like Cloudflare), try geoip-lite
  let resolvedCountry = country;
  if (!resolvedCountry && ip) {
    // Detect Local/Private IPs that geoip-lite cannot resolve
    const isLocal =
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("::ffff:127.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.");

    if (isLocal) {
      resolvedCountry = "Local";
    } else {
      const geo = geoip.lookup(ip);
      resolvedCountry = geo?.country ?? null;
    }
  }

  recordClick(shortCode, ip, resolvedCountry, userAgent);
  return { status: "ok", original_url: url.original_url };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getUrlStats(shortCode: string): UrlStats | null {
  return getStats(shortCode);
}

// ── List ──────────────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ListResult {
  data: (Omit<UrlRow, "is_active"> & { is_active: boolean })[];
  pagination: Pagination;
}

export function listUrls(
  userId: string,
  page: number,
  limit: number,
): ListResult {
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.min(100, Math.max(1, limit || 10));
  const offset = (safePage - 1) * safeLimit;

  const { rows, total } = listByUser(userId, safeLimit, offset);

  return {
    data: rows.map((r) => ({ ...r, is_active: Boolean(r.is_active) })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      total_pages: Math.ceil(total / safeLimit),
    },
  };
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export { TopUrlRow, DailyTrendRow, BotSuspectRow };

export function getTopUrlsService(from?: string, to?: string): TopUrlRow[] {
  return getTopUrls(from, to);
}

export function getDailyTrendService(
  userId: string,
  from?: string,
  to?: string,
): DailyTrendRow[] {
  return getDailyTrend(userId, from, to);
}

export function getBotSuspectsService(): BotSuspectRow[] {
  return getBotSuspects();
}

export function getGlobalClicksByCountryService(
  userId: string,
  from?: string,
  to?: string,
): { country: string; clicks: number }[] {
  return getGlobalClicksByCountry(userId, from, to);
}

// ── Delete ────────────────────────────────────────────────────────────────────

export type DeleteResult =
  | "ok"
  | "not_found"
  | "forbidden"
  | "already_inactive";

export function deleteUrl(
  shortCode: string,
  requestingUserId: string,
): DeleteResult {
  const url = findByShortCode(shortCode);

  if (!url) return "not_found";
  if (url.user_id !== requestingUserId) return "forbidden";
  if (!url.is_active) return "already_inactive";

  softDelete(shortCode);
  return "ok";
}
