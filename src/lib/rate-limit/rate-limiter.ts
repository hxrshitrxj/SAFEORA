interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodically clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 10 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  windowMs: number; // e.g. 60000 (1 min)
  maxRequests: number; // e.g. 10
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxRequests: 20 }
): { isAllowed: boolean; limit: number; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= options.maxRequests) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + options.windowMs;
    return {
      isAllowed: false,
      limit: options.maxRequests,
      remaining: 0,
      resetTime,
    };
  }

  record.timestamps.push(now);
  const remaining = options.maxRequests - record.timestamps.length;
  const resetTime = now + options.windowMs;

  return {
    isAllowed: true,
    limit: options.maxRequests,
    remaining,
    resetTime,
  };
}
