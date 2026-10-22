/**
 * In-Memory Sliding Window Rate Limiting Utility
 * Zero-Cost, zero-dependency, and safe for both Node.js server actions and Edge middleware.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, RateLimitRecord> | undefined;
}

// Global store that persists across requests on warm runtime instances
const store: Map<string, RateLimitRecord> =
  globalThis.__rateLimitStore ?? new Map<string, RateLimitRecord>();

globalThis.__rateLimitStore = store;

let lastCleanup = Date.now();

/**
 * Periodically cleans up expired records to avoid memory leaks.
 */
function pruneExpiredEntries(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  store.forEach((record, key) => {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  });
}

/**
 * Checks whether an identifier has exceeded its rate limit quota.
 *
 * @param identifier Unique key (e.g. `action:userId` or `route:ip`)
 * @param limit Maximum allowed requests within the time window
 * @param windowSeconds Time window duration in seconds (default 60s)
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number = 60
): {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  pruneExpiredEntries(now);

  const windowMs = windowSeconds * 1000;
  const record = store.get(identifier);

  if (!record || record.resetAt <= now) {
    store.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: Math.max(0, limit - 1),
      resetInSeconds: windowSeconds,
    };
  }

  if (record.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    success: true,
    remaining: Math.max(0, limit - record.count),
    resetInSeconds,
  };
}

/**
 * Extracts client IP address from a generic Headers-like object.
 */
export function extractClientIp(headersMap?: {
  get: (name: string) => string | null;
}): string {
  if (headersMap) {
    const xForwardedFor = headersMap.get("x-forwarded-for");
    if (xForwardedFor) {
      return xForwardedFor.split(",")[0].trim();
    }
    const realIp = headersMap.get("x-real-ip");
    if (realIp) return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Helper for Server Actions: resolves the client IP asynchronously from next/headers.
 */
export async function getActionClientIp(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = headers();
    return extractClientIp(h);
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Assert rate limit in Server Actions. Returns `{ success: true }` or a formatted error message.
 */
export async function assertRateLimit(
  actionName: string,
  options: {
    limit: number;
    windowSeconds?: number;
    userId?: string;
  }
): Promise<{ success: boolean; error?: string; resetInSeconds?: number }> {
  const windowSeconds = options.windowSeconds || 60;
  let identifier = options.userId;

  if (!identifier) {
    identifier = await getActionClientIp();
  }

  const key = `${actionName}:${identifier}`;
  const result = checkRateLimit(key, options.limit, windowSeconds);

  if (!result.success) {
    return {
      success: false,
      error: `Terlalu banyak permintaan. Silakan tunggu ${result.resetInSeconds} detik sebelum mencoba kembali.`,
      resetInSeconds: result.resetInSeconds,
    };
  }

  return { success: true, resetInSeconds: result.resetInSeconds };
}
