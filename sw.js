// Code here for service worker largely comes from https://developers.google.com/web/fundamentals/primers/service-workers/
// I also used suggestions from Alexandro's walkthrough

// Alexandro suggested scoping as 'const' for these, but they have worked well enough scoped as 'var'
var appName = "mws-restaurant-project"
var CACHE_NAME = appName + "-v3.0";
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
    //'/data/restaurants.json', //this is gone with stage 2
    '/images/icons/icon-72x72.png',
    '/images/icons/icon-96x96.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-384x384.png',
    '/images/icons/icon-512x512.png',
    '/js/dbhelper.js',
    '/js/dbpromise.js',
    '/js/idb.js',
    '/js/main.js',
    '/js/register-sw.js',
    '/js/restaurant_info.js',
    // note, no node_modules in this list of URLs
    '/manifest.json',
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
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith(appName) &&
                        !allCaches.includes(cacheName);
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

/**
 * Receive fetch requests and send cached data when we can.
 * If a request doesn't match anything in the cache, get it from the network,
 * send it to the page & add it to the cache at the same time.
 **/
self.addEventListener('fetch', function(event) {
    const requestUrl = new URL(event.request.url);

    // do not highjack request made from mapbox maps, leaflet, or others outside our application
    if (requestUrl.origin === location.origin) {

        // Strip search params from requests made to restaurant.html
        // respondWith restaurant.html if pathname startsWith '/restaurant.html'
        if (requestUrl.pathname.startsWith('/restaurant.html')) {
            event.respondWith(caches.match('/restaurant.html'));
            return; // If the request was for restaurant.html we are done handling request. Exit early.
        }

        // We created a new function to strip image requests down to the base image
        if (requestUrl.pathname.startsWith('/img')) {
            event.respondWith(serveImage(event.request));
            return; // If the request was for an image we are done handling request. Exit early.
        }
    }

    // By default, respond with cached elements. Fall back to network for uncached elements.
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

/**
 * This function strip images requests down to the base image name (removing -small, -medium, or -large)
 * The stripped name is used for the cache (so that we can always use the first image we stored regardless of size)
 */
function serveImage(request) {
    //we need to store the string down to manipulate it
    let imageStorageUrl = request.url;
    //stripping out the -size
    imageStorageUrl = imageStorageUrl.replace(/-small\.\w{3}|-medium\.\w{3}|-large\.\w{3}/i, '');

    return caches.open(IMG_CACHE_NAME).then(function(cache) {
        return cache.match(imageStorageUrl).then(function(response) {
            // returns the image from the cache (if it can).
            // If not it fetches from network, caches a clone, then returns the network response
            return response || fetch(request).then(function(networkResponse) {
                cache.put(imageStorageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

/**
 * This helps enable background sync
 * see: https://developers.google.com/web/updates/2015/12/background-sync
 */
self.addEventListener('sync', function(event) {
    if (event.tag == 'myFirstSync') {
        event.waitUntil(test = DBHelper.postReviewsOnline());
    }
});