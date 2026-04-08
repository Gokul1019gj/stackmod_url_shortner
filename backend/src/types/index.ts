// Repository types
export interface UrlRow {
  short_code: string;
  original_url: string;
  user_id: string | null;
  expires_at: string | null;
  is_active: number;
  created_at: string;
}

export interface CountryClickRow {
  country: string;
  clicks: number;
}

export interface UrlStats {
  url: UrlRow;
  total_clicks: number;
  unique_visitors: number;
  clicks_by_country: CountryClickRow[];
}

export interface UrlWithStats extends UrlRow {
  clicks: number;
}

export interface TopUrlRow {
  short_code: string;
  original_url: string;
  user_id: string | null;
  total_clicks: number;
  unique_visitors: number;
}

export interface DailyTrendRow {
  date: string;
  total_clicks: number;
  prev_clicks: number | null;
  change_pct: number | null;
}

export interface BotSuspectRow {
  short_code: string;
  hour: string;
  click_count: number;
  unique_ips: number;
}

// Service types
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

export type ResolveResult =
  | { status: "ok"; original_url: string }
  | { status: "not_found" }
  | { status: "expired" };

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

export type DeleteResult =
  | "ok"
  | "not_found"
  | "forbidden"
  | "already_inactive";
