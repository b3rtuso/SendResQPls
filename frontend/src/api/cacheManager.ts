/**
 * cacheManager.ts
 * 
 * Persistent Cache Manager for Web & Mobile App (Capacitor / Android).
 * Uses localStorage with JSON serialization & TTL management.
 * 
 * Supported Patterns:
 * - Stale-While-Revalidate (SWR): Returns cached data instantly (0ms), revalidates in background.
 * - Persistent Storage: Persists across browser reloads & mobile app restarts.
 * - Pattern Invalidation: Purges relevant cache keys on mutations (POST/PATCH/DELETE).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const CACHE_PREFIX = 'srq_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export class CacheManager {
  private static getKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  public static set<T>(key: string, data: T, ttlMs = DEFAULT_TTL): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttlMs,
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (e) {
      console.warn('[CacheManager] Failed to write cache to storage:', e);
    }
  }

  public static get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);

      // Check TTL expiration
      if (Date.now() - entry.timestamp > entry.ttlMs) {
        localStorage.removeItem(this.getKey(key));
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  public static invalidatePattern(pattern?: string): void {
    try {
      if (!pattern) {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
        });
        return;
      }

      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX) && k.includes(pattern)) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.warn('[CacheManager] Cache invalidation failed:', e);
    }
  }

  /**
   * Stale-While-Revalidate (SWR) Fetcher
   * Returns cached data immediately if present, revalidates in background.
   */
  public static async swrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = DEFAULT_TTL,
    onUpdate?: (freshData: T) => void
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      // Background revalidation if online
      if (typeof navigator === 'undefined' || navigator.onLine) {
        fetcher()
          .then(fresh => {
            this.set(key, fresh, ttlMs);
            if (onUpdate) onUpdate(fresh);
          })
          .catch(() => { /* Silent background fallback */ });
      }
      return cached;
    }

    // No cache entry: fetch fresh & store
    const fresh = await fetcher();
    this.set(key, fresh, ttlMs);
    return fresh;
  }
}
