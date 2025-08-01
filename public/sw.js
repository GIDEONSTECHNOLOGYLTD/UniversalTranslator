// Service Worker for Universal Translator
const CACHE_NAME = 'universal-translator-v1';
const STATIC_CACHE_NAME = 'universal-translator-static-v1';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/theme-toggle.js',
    '/analytics.js',
    '/offline-cache.js',
    '/sw.js'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    '/api/languages',
    '/api/languages/stats'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE_NAME).then(cache => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            }),
            // Cache API responses
            caches.open(CACHE_NAME).then(cache => {
                console.log('Preparing API cache');
                return Promise.all(
                    API_CACHE_PATTERNS.map(pattern => {
                        return fetch(pattern)
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(pattern, response);
                                }
                            })
                            .catch(error => {
                                console.warn(`Failed to cache ${pattern}:`, error);
                            });
                    })
                );
            })
        ]).then(() => {
            console.log('Service Worker installed successfully');
            // Force activation
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker activated');
            // Take control of all pages
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static files
    event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first strategy for some endpoints
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const cache = await caches.open(CACHE_NAME);
    
    // For translation requests, try network first, then fallback to offline translation
    if (url.pathname === '/api/translate') {
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                // Cache successful translations
                const clonedResponse = networkResponse.clone();
                cache.put(request, clonedResponse);
                return networkResponse;
            }
        } catch (error) {
            console.log('Network failed for translation, attempting offline translation');
            return handleOfflineTranslation(request);
        }
    }
    
    // For language lists and stats, use cache-first strategy
    if (API_CACHE_PATTERNS.some(pattern => url.pathname.startsWith(pattern))) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Try to update cache in background
            fetch(request).then(response => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }
            }).catch(() => {
                // Ignore network errors when updating cache
            });
            return cachedResponse;
        }
        
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            // Return offline fallback for language data
            return new Response(JSON.stringify({
                error: 'Offline mode',
                message: 'Limited functionality available offline'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    
    // Default: try network first, then cache
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
    }
    
    // Return error response
    return new Response(JSON.stringify({
        error: 'Service unavailable',
        message: 'Unable to process request offline'
    }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Handle offline translation using basic dictionary
async function handleOfflineTranslation(request) {
    try {
        const body = await request.json();
        const { text, from, to } = body;
        
        // Basic offline translation dictionary
        const offlineTranslations = {
            'english_to_swahili': {
                'hello': 'hujambo',
                'goodbye': 'kwaheri',
                'thank you': 'asante',
                'please': 'tafadhali',
                'yes': 'ndio',
                'no': 'hapana',
                'good': 'nzuri'
            },
            'english_to_zulu': {
                'hello': 'sawubona',
                'goodbye': 'sala kahle',
                'thank you': 'ngiyabonga',
                'please': 'ngicela',
                'yes': 'yebo',
                'no': 'cha',
                'good': 'okuhle'
            },
            'english_to_yoruba': {
                'hello': 'kaabo',
                'goodbye': 'o dabo',
                'thank you': 'e se',
                'please': 'je ka lo',
                'yes': 'beni',
                'no': 'rara',
                'good': 'o dara'
            }
        };
        
        const translationKey = `${from}_to_${to}`;
        const dict = offlineTranslations[translationKey];
        const lowerText = text.toLowerCase();
        
        let translatedText = text;
        let confidence = 0.3;
        
        if (dict && dict[lowerText]) {
            translatedText = dict[lowerText];
            confidence = 0.8;
        }
        
        const response = {
            translatedText,
            sourceLanguage: from,
            targetLanguage: to,
            confidence,
            method: 'offline_dictionary',
            originalText: text
        };
        
        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Offline translation failed',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle static file requests
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    
    // Try cache first for static files
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Try network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlineResponse = await cache.match('/index.html');
            if (offlineResponse) {
                return offlineResponse;
            }
        }
    }
    
    // Return 404 for other requests
    return new Response('Not found', { status: 404 });
}

// Handle messages from main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_STATS') {
        getCacheStats().then(stats => {
            event.ports[0].postMessage(stats);
        });
    }
});

// Get cache statistics
async function getCacheStats() {
    const caches_list = await caches.keys();
    const stats = {};
    
    for (const cacheName of caches_list) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats[cacheName] = keys.length;
    }
    
    return stats;
}
