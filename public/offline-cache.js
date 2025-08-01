// Offline Translation Cache System
class OfflineCache {
    constructor() {
        this.cacheName = 'universal-translator-cache-v1';
        this.translationCache = new Map();
        this.maxCacheSize = 1000;
        this.init();
    }
    
    async init() {
        // Load cached translations from localStorage
        try {
            const cached = localStorage.getItem('translationCache');
            if (cached) {
                const parsedCache = JSON.parse(cached);
                this.translationCache = new Map(parsedCache);
            }
        } catch (error) {
            console.warn('Failed to load translation cache:', error);
        }
        
        // Register service worker for offline functionality
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered for offline support');
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }
    
    // Generate cache key for translation
    getCacheKey(text, from, to) {
        return `${from}:${to}:${text.toLowerCase()}`;
    }
    
    // Get cached translation
    getCachedTranslation(text, from, to) {
        const key = this.getCacheKey(text, from, to);
        const cached = this.translationCache.get(key);
        
        if (cached) {
            // Update access time for LRU
            cached.lastAccessed = Date.now();
            return cached;
        }
        
        return null;
    }
    
    // Cache a translation
    cacheTranslation(text, from, to, translatedText, confidence, method) {
        const key = this.getCacheKey(text, from, to);
        
        // Implement LRU cache eviction
        if (this.translationCache.size >= this.maxCacheSize) {
            this.evictOldest();
        }
        
        const cacheEntry = {
            originalText: text,
            translatedText,
            sourceLanguage: from,
            targetLanguage: to,
            confidence,
            method,
            timestamp: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 1
        };
        
        this.translationCache.set(key, cacheEntry);
        this.persistCache();
    }
    
    // Evict oldest entries when cache is full
    evictOldest() {
        let oldest = null;
        let oldestTime = Date.now();
        
        for (const [key, entry] of this.translationCache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldest = key;
            }
        }
        
        if (oldest) {
            this.translationCache.delete(oldest);
        }
    }
    
    // Persist cache to localStorage
    persistCache() {
        try {
            const cacheArray = Array.from(this.translationCache.entries());
            localStorage.setItem('translationCache', JSON.stringify(cacheArray));
        } catch (error) {
            console.warn('Failed to persist translation cache:', error);
        }
    }
    
    // Get cache statistics
    getCacheStats() {
        const entries = Array.from(this.translationCache.values());
        const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
        const avgConfidence = entries.reduce((sum, entry) => sum + entry.confidence, 0) / entries.length;
        
        return {
            totalEntries: this.translationCache.size,
            maxSize: this.maxCacheSize,
            totalAccesses,
            averageConfidence: avgConfidence || 0,
            oldestEntry: Math.min(...entries.map(e => e.timestamp)),
            newestEntry: Math.max(...entries.map(e => e.timestamp))
        };
    }
    
    // Clear cache
    clearCache() {
        this.translationCache.clear();
        localStorage.removeItem('translationCache');
    }
    
    // Export cache for backup
    exportCache() {
        const cacheData = {
            version: 1,
            timestamp: Date.now(),
            entries: Array.from(this.translationCache.entries())
        };
        
        const blob = new Blob([JSON.stringify(cacheData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translation-cache-backup.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Import cache from backup
    async importCache(file) {
        try {
            const text = await file.text();
            const cacheData = JSON.parse(text);
            
            if (cacheData.version === 1 && cacheData.entries) {
                this.translationCache = new Map(cacheData.entries);
                this.persistCache();
                return true;
            }
        } catch (error) {
            console.error('Failed to import cache:', error);
        }
        return false;
    }
    
    // Get frequently used translations
    getPopularTranslations(limit = 10) {
        const entries = Array.from(this.translationCache.values());
        return entries
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, limit)
            .map(entry => ({
                text: entry.originalText,
                translation: entry.translatedText,
                from: entry.sourceLanguage,
                to: entry.targetLanguage,
                uses: entry.accessCount
            }));
    }
}

// Global cache instance
window.offlineCache = new OfflineCache();
