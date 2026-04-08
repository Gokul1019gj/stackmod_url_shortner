import { SlidingWindowRateLimiter } from '../src/middleware/rateLimiter';

describe('SlidingWindowRateLimiter', () => {
  // Test 1: Basic allow — requests under limit all pass
  test('allows requests under the limit', () => {
    const limiter = new SlidingWindowRateLimiter({ max_requests: 3, window_seconds: 60 });

    expect(limiter.check('user_1')).toEqual({ allowed: true });
    expect(limiter.check('user_1')).toEqual({ allowed: true });
    expect(limiter.check('user_1')).toEqual({ allowed: true });
  });

  // Test 2: Basic deny — request over limit returns 429-like response
  test('denies the request that exceeds the limit', () => {
    const limiter = new SlidingWindowRateLimiter({ max_requests: 3, window_seconds: 60 });

    limiter.check('user_1');
    limiter.check('user_1');
    limiter.check('user_1');

    const result = limiter.check('user_1');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  // Test 3: Window expiry — old requests expire, new ones are allowed
  test('allows requests after the window expires', () => {
    let fakeTime = 0;
    const limiter = new SlidingWindowRateLimiter(
      { max_requests: 2, window_seconds: 60 },
      () => fakeTime
    );

    // Use up the limit at t=0
    limiter.check('user_1');
    limiter.check('user_1');
    expect(limiter.check('user_1').allowed).toBe(false);

    // Advance clock past the window (61 seconds later)
    fakeTime = 61_000;

    // Window has reset — requests should be allowed again
    expect(limiter.check('user_1')).toEqual({ allowed: true });
    expect(limiter.check('user_1')).toEqual({ allowed: true });
  });

  // Test 4: Multiple users independently limited
  test('limits users independently — one user hitting limit does not affect another', () => {
    const limiter = new SlidingWindowRateLimiter({ max_requests: 2, window_seconds: 60 });

    // user_123 hits limit
    limiter.check('user_123');
    limiter.check('user_123');
    expect(limiter.check('user_123').allowed).toBe(false);

    // user_456 is unaffected
    expect(limiter.check('user_456')).toEqual({ allowed: true });
    expect(limiter.check('user_456')).toEqual({ allowed: true });
  });

  // Test 5: Edge case — max_requests = 1
  test('denies immediately on second request when max_requests = 1', () => {
    const limiter = new SlidingWindowRateLimiter({ max_requests: 1, window_seconds: 60 });

    expect(limiter.check('user_1')).toEqual({ allowed: true });
    const result = limiter.check('user_1');
    expect(result.allowed).toBe(false);
  });

  // Test 6: Rapid burst — correct Retry-After header value
  test('Retry-After reflects remaining window time accurately', () => {
    let fakeTime = 0;
    const limiter = new SlidingWindowRateLimiter(
      { max_requests: 3, window_seconds: 60 },
      () => fakeTime
    );

    // Fire 3 requests at t=0
    limiter.check('user_1'); // oldest ts = 0
    limiter.check('user_1');
    limiter.check('user_1');

    // Advance 10 seconds
    fakeTime = 10_000;

    // 4th request should be denied; retry-after = 60 - 10 = 50 seconds
    const result = limiter.check('user_1');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      // oldest_ts(0) + window_ms(60000) - currentTime(10000) = 50000ms → 50s
      expect(result.retryAfterSeconds).toBe(50);
    }
  });

  // Test 7: Sliding window — partial expiry allows more requests
  test('sliding window: partial expiry allows new requests without full reset', () => {
    let fakeTime = 0;
    const limiter = new SlidingWindowRateLimiter(
      { max_requests: 3, window_seconds: 60 },
      () => fakeTime
    );

    // 2 requests at t=0
    limiter.check('user_1');
    limiter.check('user_1');

    // 1 request at t=30s
    fakeTime = 30_000;
    limiter.check('user_1'); // 3rd — at limit now

    // At t=61s, the first 2 (from t=0) have expired; 1 remains (t=30s)
    fakeTime = 61_000;
    // Should allow 2 more (total in window = 1 + 2 = 3)
    expect(limiter.check('user_1')).toEqual({ allowed: true });
    expect(limiter.check('user_1')).toEqual({ allowed: true });
    // 4th would exceed
    expect(limiter.check('user_1').allowed).toBe(false);
  });
});
