-- URL Shortener Analytics & Core Queries
-- These represent the raw SQL execution patterns used by the application repositories.

-- 1. Insert a new shortened URL
INSERT INTO urls (short_code, original_url, user_id, expires_at)
VALUES (?, ?, ?, ?);

-- 2. Basic Redirect Lookup (Find original URL by short code)
SELECT original_url, is_active, expires_at 
FROM urls 
WHERE short_code = ?;

-- 3. Log a Click Event
INSERT INTO click_events (short_code, ip_address, country, user_agent)
VALUES (?, ?, ?, ?);

-- 4. Part B: Analytics — Per-URL Stats (Total Clicks & Unique Visitors)
SELECT 
    COUNT(*) AS total_clicks, 
    COUNT(DISTINCT ip_address) AS unique_visitors
FROM click_events 
WHERE short_code = ?;

-- 5. Part C: Query 2 — Top 10 Most Clicked URLs (Filterable by Date)
SELECT 
    u.short_code, 
    u.original_url, 
    u.user_id,
    COUNT(c.id) AS total_clicks,
    COUNT(DISTINCT c.ip_address) AS unique_visitors
FROM urls u
JOIN click_events c ON c.short_code = u.short_code
WHERE c.clicked_at >= ? AND c.clicked_at <= ?
GROUP BY u.short_code
ORDER BY total_clicks DESC
LIMIT 10;

-- 6. Part C: Query 3 — Daily Click Trend (Window Function over 30 days)
WITH DailyCounts AS (
  SELECT 
    date(clicked_at) as date, 
    COUNT(*) as total_clicks
  FROM click_events c
  JOIN urls u ON c.short_code = u.short_code
  WHERE u.user_id = ? 
    AND c.clicked_at >= ? 
    AND c.clicked_at <= ?
  GROUP BY date(clicked_at)
)
SELECT 
  date,
  total_clicks,
  LAG(total_clicks) OVER (ORDER BY date) AS prev_clicks,
  CASE
    WHEN LAG(total_clicks) OVER (ORDER BY date) IS NULL OR LAG(total_clicks) OVER (ORDER BY date) = 0 THEN NULL
    ELSE ROUND((total_clicks - LAG(total_clicks) OVER (ORDER BY date)) * 100.0 / LAG(total_clicks) OVER (ORDER BY date), 2)
  END AS change_pct
FROM DailyCounts
ORDER BY date DESC;

-- 7. Part C: Query 4 — Bot Suspect Detection (High clicks, very few IPs)
SELECT 
    short_code, 
    strftime('%Y-%m-%d %H:00:00', clicked_at) AS hour,
    COUNT(*) AS click_count,
    COUNT(DISTINCT ip_address) AS unique_ips
FROM click_events
GROUP BY short_code, hour
HAVING click_count > 1000 AND unique_ips < 3
ORDER BY click_count DESC;
