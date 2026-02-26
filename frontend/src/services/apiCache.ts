/**
 * API Response Cache Utility
 * Fragranza Olio - In-memory cache with TTL for API responses
 * 
 * Usage:
 *   import { apiCache } from '../services/apiCache';
 *   
 *   // In a component or service:
 *   const cached = apiCache.get('products-page1');
 *   if (cached) return cached;
 *   
 *   const data = await fetchFromApi();
 *   apiCache.set('products-page1', data, 5 * 60 * 1000); // 5 min TTL
 *   return data;
 */

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private maxEntries: number;

  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
  }

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in the cache with a TTL (in milliseconds)
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set<T = unknown>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    // Evict oldest entries if we're at capacity
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache keys matching a prefix
   * Useful for invalidating all product-related or all order-related caches
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxEntries: number } {
    // Clean expired entries first
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return { size: this.cache.size, maxEntries: this.maxEntries };
  }
}

// Singleton instance - shared across the app
export const apiCache = new ApiCache(100);

// Common TTL constants
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,        // 1 minute - for frequently changing data
  MEDIUM: 5 * 60 * 1000,       // 5 minutes - default, for product lists
  LONG: 15 * 60 * 1000,        // 15 minutes - for categories, rarely changing data
  VERY_LONG: 60 * 60 * 1000,   // 1 hour - for static content
} as const;

// Cache key generators for consistency
export const cacheKeys = {
  products: (filters?: string) => `products:${filters || 'all'}`,
  product: (id: number) => `product:${id}`,
  categories: () => 'categories',
  analytics: (period: string) => `analytics:${period}`,
  dashboardStats: (period: string) => `dashboard:${period}`,
  orders: (filters?: string) => `orders:${filters || 'all'}`,
} as const;
