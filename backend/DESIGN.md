# System Design — URL Shortener Service

## Question 1: High-Level Architecture (10,000 shorten/s · 100,000 redirect/s)

### Key Insight
The two workloads have very different profiles:
- **Shorten** (write-heavy, ~10k/s): requires uniqueness, persistence, validation.
- **Redirect** (read-heavy, ~100k/s): latency-critical, highly cacheable.

### Architecture

```
Client
  │
  ▼
CDN (Cloudflare / AWS CloudFront)
  │  ← Caches short_code → original_url at edge (TTL-based)
  │  ← Serves ~70% of redirects without hitting origin
  │
  ▼
Load Balancer (L7 — NGINX / AWS ALB)
  │
  ├──► API Pod 1  ─┐
  ├──► API Pod 2  ─┤── Redis Cluster (hot URL cache, rate limiter state)
  └──► API Pod N  ─┘       │
           │               │ cache miss
           ▼               ▼
      PostgreSQL Primary ←─┘
           │
           ├── Read Replica 1  (serves GET /api/urls, stats)
           └── Read Replica 2

Redirect click events:
  API Pod → Kafka Topic: "click_events"
                │
                ▼
          Consumer Group → ClickHouse (analytics OLAP)
```

### Data Flow: Redirect Request → Analytics Update

1. Client sends `GET /abc123`.
2. CDN checks its edge cache. If hit → 302 immediately (no origin call).
3. On cache miss: CDN forwards to Load Balancer → API Pod.
4. API Pod checks **Redis** for `short_code → original_url`. If hit → 302, enqueue event.
5. On Redis miss: API Pod queries PostgreSQL read replica, writes result to Redis, returns 302.
6. Separately (async), API Pod publishes `{ short_code, ip, country, user_agent, ts }` to **Kafka**.
7. Kafka consumer batch-writes events to **ClickHouse** every few seconds.

This async write path keeps redirect latency under 10 ms while still capturing every click.

---

## Question 2: Short Code Generation at Scale

### Approach 1 — Random Base62 + DB Uniqueness Check
Generate a 6-character random base62 string, attempt an `INSERT`; retry on unique-key violation.

| Dimension | Detail |
|-----------|--------|
| Collision risk | Low at low fill (<50M codes), grows at high fill |
| Latency | 1 DB round-trip normally; more on collision |
| Complexity | Very simple — no coordination needed |
| SPOF | None — fully distributed |

**Trade-off:** Works well up to ~50 M records. Beyond that, collision rate increases and retries add latency.

### Approach 2 — Snowflake-style Distributed ID → Base62
Each server instance is assigned a unique `worker_id` (1–1023). Every request generates:

```
[41-bit timestamp ms] [10-bit worker_id] [12-bit sequence]
```

The 63-bit integer is base62-encoded to 9–10 characters. IDs are **guaranteed unique** across all instances without coordination.

| Dimension | Detail |
|-----------|--------|
| Collision risk | Zero (by construction) |
| Latency | O(1), no DB check needed |
| Complexity | Requires worker_id assignment (e.g. Zookeeper, env var) |
| SPOF | None once worker IDs are assigned |

**Trade-off:** Slightly longer codes (~9 chars); requires coordinated worker ID allocation at deploy time.

### Recommendation
Use **Approach 1** for < 10 M records (simpler). Switch to **Approach 2** (Snowflake) when operating at scale with multiple instances, to eliminate collision retries.

---

## Question 3: Data Storage Strategy

### URL Table — PostgreSQL
- Low volume (millions of rows, not billions).
- Requires strong consistency (unique short codes, FK integrity).
- Write-once, read-many → benefits from read replicas and Redis caching.

### Click Events — ClickHouse (or TimescaleDB)
- Append-only, write-heavy (billions of rows).
- Query pattern is aggregation over time ranges — ideal for columnar storage.
- ClickHouse: 10–100× faster than PostgreSQL for COUNT, GROUP BY on large time-series.
- TimescaleDB: stays within PostgreSQL ecosystem, easier ops, slightly lower performance ceiling.

### Partitioning Strategy
Partition `click_events` by **month** (`clicked_at`):
```sql
PARTITION BY RANGE (toYYYYMM(clicked_at))  -- ClickHouse
```
Benefits: partition pruning eliminates irrelevant months from scans; old partitions can be dropped cheaply for data retention.

### Caching Strategy — Redirect Endpoint
```
Cache key   : short_code
Cache value : { original_url, expires_at, is_active }
TTL         : min(expires_at - now, 24 hours)
Eviction    : LRU (evict least-recently-used on memory pressure)
Invalidation: On DELETE (soft-delete), immediately DEL the cache key
```
With Redis, a typical URL lookup becomes a single `GET` command (~0.5 ms), reducing PostgreSQL load by ~90% for popular links.
