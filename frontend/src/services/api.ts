import type {
  ShortenRequest,
  ShortenResponse,
  UrlStats,
  UrlEntry,
  AuthResponse,
  TopUrlEntry,
  DailyTrendEntry,
  BotSuspectEntry,
  CountryClickEntry,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";
const API_BASE = `${BASE_URL}/api`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async login(credentials: unknown): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  async signup(credentials: unknown): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data;
  },

  async shorten(payload: ShortenRequest): Promise<ShortenResponse> {
    const res = await fetch(`${API_BASE}/shorten`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to shorten URL");

    const short_url = `${BASE_URL}/${data.short_code}`;
    return { ...data, short_url };
  },

  async getMyUrls(): Promise<UrlEntry[]> {
    const res = await fetch(`${API_BASE}/urls`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch URLs");

    return data.data.map((item: UrlEntry) => ({
      ...item,
      short_url: `${BASE_URL}/${item.short_code}`,
    }));
  },

  async getStats(shortCode: string): Promise<UrlStats> {
    const res = await fetch(`${API_BASE}/urls/${shortCode}/stats`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch stats");
    return data;
  },

  async deleteUrl(shortCode: string): Promise<void> {
    const res = await fetch(`${API_BASE}/urls/${shortCode}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete URL");
    }
  },

  async getTopUrls(from?: string, to?: string): Promise<TopUrlEntry[]> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/analytics/top-urls${qs}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch top URLs");
    return data;
  },

  async getDailyTrend(from?: string, to?: string): Promise<DailyTrendEntry[]> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/analytics/trend${qs}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch trend data");
    return data;
  },

  async getGlobalCountries(
    from?: string,
    to?: string,
  ): Promise<CountryClickEntry[]> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/analytics/countries${qs}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Failed to fetch country clicks");
    return data;
  },

  async getBotReport(): Promise<BotSuspectEntry[]> {
    const res = await fetch(`${API_BASE}/analytics/bot-report`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch bot report");
    return data;
  },
};
