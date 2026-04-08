import { Request, Response, NextFunction } from 'express';

export interface RateLimiterConfig {
  max_requests: number;
  window_seconds: number;
}

// Exported so tests can inject a custom clock
export type NowFn = () => number;

export class SlidingWindowRateLimiter {
  private store: Map<string, number[]> = new Map();
  private readonly max_requests: number;
  private readonly window_ms: number;
  private readonly now: NowFn;

  constructor(config: RateLimiterConfig, now: NowFn = Date.now) {
    this.max_requests = config.max_requests;
    this.window_ms = config.window_seconds * 1000;
    this.now = now;
  }

  /**
   * Check if the request for the given key is allowed.
   * Returns { allowed: true } or { allowed: false, retryAfterSeconds: number }.
   */
  check(key: string): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
    const currentTime = this.now();
    const windowStart = currentTime - this.window_ms;

    // Get existing timestamps, prune expired ones
    const timestamps = (this.store.get(key) ?? []).filter(ts => ts > windowStart);

    if (timestamps.length >= this.max_requests) {
      // Oldest timestamp in window — window resets after it expires
      const oldestTs = timestamps[0];
      const retryAfterMs = oldestTs + this.window_ms - currentTime;
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      this.store.set(key, timestamps);
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
    }

    timestamps.push(currentTime);
    this.store.set(key, timestamps);
    return { allowed: true };
  }

  // For testing: clear all state
  reset(): void {
    this.store.clear();
  }
}

// Default singleton limiter (10 req / 60s)
const defaultLimiter = new SlidingWindowRateLimiter({ max_requests: 10, window_seconds: 60 });

export function rateLimitMiddleware(
  limiter: SlidingWindowRateLimiter = defaultLimiter
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key: string = (req.body?.user_id as string | undefined) || req.ip || 'unknown';
    const result = limiter.check(key);

    if (!result.allowed) {
      res.set('Retry-After', String(result.retryAfterSeconds));
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Retry after ${result.retryAfterSeconds} seconds.`,
        retry_after: result.retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
