import { getDb } from "../db";
import {
  UrlRow,
  CountryClickRow,
  UrlStats,
  UrlWithStats,
  TopUrlRow,
  DailyTrendRow,
  BotSuspectRow,
} from "../types";

export function findByShortCode(shortCode: string): UrlRow | undefined {
  return getDb()
    .prepare(
      `SELECT short_code, original_url, user_id, expires_at, is_active, created_at
       FROM urls WHERE short_code = ?`,
    )
    .get(shortCode) as UrlRow | undefined;
}

export function shortCodeExists(shortCode: string): boolean {
  const row = getDb()
    .prepare(`SELECT 1 FROM urls WHERE short_code = ?`)
    .get(shortCode);
  return row !== undefined;
}

export function insertUrl(
  shortCode: string,
  originalUrl: string,
  userId: string | null,
  expiresAt: string | null,
): void {
  getDb()
    .prepare(
      `INSERT INTO urls (short_code, original_url, user_id, expires_at) VALUES (?, ?, ?, ?)`,
    )
    .run(shortCode, originalUrl, userId, expiresAt);
}

export function listByUser(
  userId: string,
  limit: number,
  offset: number,
): { rows: UrlWithStats[]; total: number } {
  const db = getDb();
  const { total } = db
    .prepare(
      `SELECT COUNT(*) AS total FROM urls WHERE user_id = ? AND is_active = 1`,
    )
    .get(userId) as { total: number };

  const rows = db
    .prepare(
      `SELECT u.short_code, u.original_url, u.expires_at, u.is_active, u.created_at,
              (SELECT COUNT(*) FROM click_events c WHERE c.short_code = u.short_code) AS clicks,
              (SELECT MAX(c.clicked_at) FROM click_events c WHERE c.short_code = u.short_code) AS last_accessed
       FROM urls u WHERE u.user_id = ? AND u.is_active = 1 
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(userId, limit, offset) as (UrlWithStats & {
    last_accessed: string | null;
  })[];

  return { rows, total };
}

export function softDelete(shortCode: string): void {
  getDb()
    .prepare(`UPDATE urls SET is_active = 0 WHERE short_code = ?`)
    .run(shortCode);
}

export function recordClick(
  shortCode: string,
  ip: string | null,
  country: string | null,
  userAgent: string | null,
): void {
  getDb()
    .prepare(
      `INSERT INTO click_events (short_code, ip_address, country, user_agent) VALUES (?, ?, ?, ?)`,
    )
    .run(shortCode, ip, country, userAgent);
}

// ── Q2: Top 10 most-clicked URLs in last 7 days ───────────────────────────────

export function getTopUrls(from?: string, to?: string): TopUrlRow[] {
  // Defaults: last 7 days
  const fromClause = from ?? `datetime('now', '-7 days')`;
  const toClause = to ?? `datetime('now')`;

  const useParams = !!(from || to);

  if (useParams) {
    return getDb()
      .prepare(
        `SELECT u.short_code, u.original_url, u.user_id,
                COUNT(c.id) AS total_clicks,
                COUNT(DISTINCT c.ip_address) AS unique_visitors
         FROM urls u
         JOIN click_events c ON c.short_code = u.short_code
         WHERE c.clicked_at >= ? AND c.clicked_at <= ?
         GROUP BY u.short_code
         ORDER BY total_clicks DESC
         LIMIT 10`,
      )
      .all(fromClause, toClause) as TopUrlRow[];
  }

  // Default: no bind params, use SQLite now() expressions directly
  return getDb()
    .prepare(
      `SELECT u.short_code, u.original_url, u.user_id,
              COUNT(c.id) AS total_clicks,
              COUNT(DISTINCT c.ip_address) AS unique_visitors
       FROM urls u
       JOIN click_events c ON c.short_code = u.short_code
       WHERE c.clicked_at >= datetime('now', '-7 days')
       GROUP BY u.short_code
       ORDER BY total_clicks DESC
       LIMIT 10`,
    )
    .all() as TopUrlRow[];
}

// ── Q3: Daily click trend for a user over 30 days ─────────────────────────────

export function getDailyTrend(
  userId: string,
  from?: string,
  to?: string,
): DailyTrendRow[] {
  const fromDate = from ?? `datetime('now', '-30 days')`;
  const toDate = to ?? `datetime('now')`;

  const useParams = !!(from || to);

  const whereExtra = useParams
    ? `AND c.clicked_at >= ? AND c.clicked_at <= ?`
    : `AND c.clicked_at >= datetime('now', '-30 days')`;

  const params: string[] = useParams ? [userId, fromDate, toDate] : [userId];

  return getDb()
    .prepare(
      `WITH daily AS (
         SELECT date(c.clicked_at) AS date,
                COUNT(*) AS total_clicks
         FROM click_events c
         JOIN urls u ON u.short_code = c.short_code
         WHERE u.user_id = ?
           ${whereExtra}
         GROUP BY date(c.clicked_at)
       )
       SELECT date,
              total_clicks,
              LAG(total_clicks) OVER (ORDER BY date) AS prev_clicks,
              CASE
                WHEN LAG(total_clicks) OVER (ORDER BY date) IS NULL THEN NULL
                WHEN LAG(total_clicks) OVER (ORDER BY date) = 0 THEN NULL
                ELSE ROUND(
                  (total_clicks - LAG(total_clicks) OVER (ORDER BY date)) * 100.0
                  / LAG(total_clicks) OVER (ORDER BY date),
                  2
                )
              END AS change_pct
       FROM daily
       ORDER BY date ASC`,
    )
    .all(...params) as DailyTrendRow[];
}

// ── Q4: Bot detection ─────────────────────────────────────────────────────────

export function getBotSuspects(): BotSuspectRow[] {
  return getDb()
    .prepare(
      `SELECT c.short_code,
              strftime('%Y-%m-%d %H:00', c.clicked_at) AS hour,
              COUNT(*) AS click_count,
              COUNT(DISTINCT c.ip_address) AS unique_ips
       FROM click_events c
       GROUP BY c.short_code, strftime('%Y-%m-%d %H:00', c.clicked_at)
       HAVING click_count > 1000 AND unique_ips < 3
       ORDER BY click_count DESC`,
    )
    .all() as BotSuspectRow[];
}

export function getGlobalClicksByCountry(
  userId: string,
  from?: string,
  to?: string,
): CountryClickRow[] {
  let query = `SELECT COALESCE(c.country, 'Unknown') AS country, COUNT(*) AS clicks
               FROM click_events c
               JOIN urls u ON c.short_code = u.short_code
               WHERE u.user_id = ?`;
  const params: unknown[] = [userId];

  if (from) {
    query += ` AND c.clicked_at >= ?`;
    params.push(from);
  }
  if (to) {
    query += ` AND c.clicked_at <= ?`;
    params.push(to);
  }

  query += ` GROUP BY c.country ORDER BY clicks DESC`;

  return getDb()
    .prepare(query)
    .all(...params) as CountryClickRow[];
}

export function getStats(shortCode: string): UrlStats | null {
  const db = getDb();

  const url = findByShortCode(shortCode);
  if (!url) return null;

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total_clicks, COUNT(DISTINCT ip_address) AS unique_visitors
       FROM click_events WHERE short_code = ?`,
    )
    .get(shortCode) as { total_clicks: number; unique_visitors: number };

  const clicks_by_country = db
    .prepare(
      `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS clicks
       FROM click_events WHERE short_code = ? GROUP BY country ORDER BY clicks DESC`,
    )
    .all(shortCode) as CountryClickRow[];

  return {
    url,
    total_clicks: totals.total_clicks,
    unique_visitors: totals.unique_visitors,
    clicks_by_country,
  };
}
