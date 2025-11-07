'use strict';

/**
 * BUNZ Cache - HTTP-based caching with busting
 * Smart caching that respects HTTP headers
 */
class BunzCache {
    cache = new Map();
    etags = new Map();
    version = Date.now(); // Global cache buster
    
    /**
     * Fetch with cache check
     */
    async fetch(url, options = {}) {
        const cacheKey = this.getCacheKey(url);
        const useCache = options.cache !== false;
        
        // Check cache
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (!this.isExpired(cached)) {
                console.log('📦 Cache hit:', url);
                return cached.data;
            }
        }
        
        // Add version param for cache busting
        const fetchUrl = options.bustCache ? this.addVersionParam(url) : url;
        
        // Fetch with ETag support
        const headers = {};
        if (this.etags.has(cacheKey)) {
            headers['If-None-Match'] = this.etags.get(cacheKey);
        }
        
        const response = await fetch(fetchUrl, { headers });
        
        // 304 Not Modified - use cached version
        if (response.status === 304 && this.cache.has(cacheKey)) {
            console.log('✨ 304 Not Modified:', url);
            return this.cache.get(cacheKey).data;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.text();
        
        // Store ETag
        const etag = response.headers.get('ETag');
        if (etag) {
            this.etags.set(cacheKey, etag);
        }
        
        // Parse Cache-Control
        const cacheControl = response.headers.get('Cache-Control');
        const maxAge = this.parseMaxAge(cacheControl);
        
        // Store in cache
        if (useCache && maxAge > 0) {
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                maxAge
            });
            console.log(`💾 Cached (${maxAge}s):`, url);
        }
        
        return data;
    }
    
    /**
     * Get cache key
     */
    getCacheKey(url) {
        return url.split('?')[0]; // Ignore query params
    }
    
    /**
     * Add version param for cache busting
     */
    addVersionParam(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${this.version}`;
    }
    
    /**
     * Parse max-age from Cache-Control header
     */
    parseMaxAge(cacheControl) {
        if (!cacheControl) return 0;
        const match = cacheControl.match(/max-age=(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    
    /**
     * Check if cache entry is expired
     */
    isExpired(entry) {
        const age = (Date.now() - entry.timestamp) / 1000;
        return age > entry.maxAge;
    }
    
    /**
     * Clear cache
     */
    clear(url) {
        if (url) {
            const key = this.getCacheKey(url);
            this.cache.delete(key);
            this.etags.delete(key);
        } else {
            this.cache.clear();
            this.etags.clear();
            this.version = Date.now();
        }
    }
    
    /**
     * Invalidate cache by pattern
     */
    invalidate(pattern) {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                this.etags.delete(key);
            }
        }
    }
}

window.bunzCache = new BunzCache();
console.log('✅ BUNZ Cache initialized');

