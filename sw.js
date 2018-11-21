// Code here for service worker largely comes from https://developers.google.com/web/fundamentals/primers/service-workers/
// I also used suggestions from Alexandro's walkthrough

var appName = "mws-restaurant-project"
var CACHE_NAME = appName + "-v1.1";
var IMG_CACHE_NAME = appName + "images";
var allCaches = [
    CACHE_NAME,
    IMG_CACHE_NAME
];
// Static Assets
var urlsToCache = [
    '/', //caches index.html
    '/css/styles.css',
    '/css/styles_large.css',
    '/css/styles_medium.css',
    '/data/restaurants.json',
    // note, no images or img in this list of URLs
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/register-sw.js',
    '/js/restaurant_info.js',
    // note, no node_modules in this list of URLs
    '/restaurant.html'
];

/** Caches all static assets (user interface items) at Service Worker Install time*/
self.addEventListener('install', function(event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

/** Currently open pages keep the old service worker controlling
 * the current pages so the new service worker will enter a waiting state.
 * When the currently open pages are closed, the old service worker
 * will be killed and the new service worker will take control.
 * Once the new service worker takes control, its activate event will be fired.*/
self.addEventListener('activate', function(event) {
    //not currently using a Whitelist (working off the current cacheName)
    //only deletes caches with the
    //var cacheWhitelist = ['pages-cache-v1', 'blog-posts-cache-v1'];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith(appName) &&
                        !allCaches.includes(cacheName);
                }).map(function(cacheName) {
                    //if (cacheWhitelist.indexOf(cacheName) === -1) {
                    return caches.delete(cacheName);
                    //}
                })
            );
        })
    );
});

/** Using code from offline cookbook:
 * https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
 * If a request doesn't match anything in the cache, get it from the network,
 * send it to the page & add it to the cache at the same time.
 * If there's a cached version available, use it, but fetch an update for next time.
 * Making this more like Alexandro's code from his walkthrough in an attempt to troublshoot
 * some issues.*/
self.addEventListener('fetch', function(event) {
    event.respondWith(
        /**caches.open(IMG_CACHE_NAME).then(function(cache) {
            return cache.match(event.request).then(function(response) {
                var fetchPromise = fetch(event.request).then(function(networkResponse) {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                })**/
            caches.match(event.request).then(function(response) {
                return response || fetchPromise;
            //})
        })
    );
});