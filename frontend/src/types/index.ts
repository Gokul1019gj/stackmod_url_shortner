export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ShortenRequest {
  original_url: string;
  custom_alias?: string;
  expires_at?: string;
}

export interface ShortenResponse {
  short_code: string;
  original_url: string;
  expires_at: string | null;
  short_url: string;
  created_at: string;
}

export interface UrlStats {
  short_code: string;
  original_url: string;
  clicks: number;
  last_accessed: string | null;
  created_at: string;
}

export interface UrlEntry extends UrlStats {
  short_url: string;
}

export interface TopUrlEntry {
  short_code: string;
  original_url: string;
  user_id: string | null;
  total_clicks: number;
  unique_visitors: number;
}

export interface CountryClickEntry {
  country: string;
  clicks: number;
}

export interface DailyTrendEntry {
  date: string;
  total_clicks: number;
  prev_clicks: number | null;
  change_pct: number | null;
}

export interface BotSuspectEntry {
  short_code: string;
  hour: string;
  click_count: number;
  unique_ips: number;
}
