// Constantes
const VERSION = "02.00.002";
const CACHE_NAME_STATIC = "static-" + VERSION;
const CACHE_NAME_DYNAMIC = "dynamic-" + VERSION;
const urlsToCache = [ 
        "./",
        "./index.html",
        "./src/index.js",
        "./src/ajax.js",
        "./src/highcharts.js",
        "./src/highcharts.css",
        "./src/variable-pie.js",
        "./src/style.css", 
        "./src/script.js",
        "./fonts/fa-solid-900.ttf",
        "./fonts/Spartan-Black.ttf", 
        "./fonts/Spartan-Bold.ttf",
        "./fonts/Spartan-Light.ttf",
        "./images/Euro.png",
        "./images/Stats.png",
        "./images/Wallet.png",
        "./images/Fleche.png",
        "./manifest.json"
    ];

// Install SW
self.addEventListener("install", event => {
    console.log('[Service Worker] [version : ' + VERSION + ']');
    console.log('[Service Worker] [1] Installation Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME_STATIC).then(cache => {
            console.log('[Service Worker] Precache des fichiers');
            return cache.addAll(urlsToCache);
        }).catch(error => {
            console.log('[Service Worker] Erreur de precache : ', error);
        })
    );
});

// Listen for request
/**self.addEventListener("fetch", event => {
    console.log('[Service Worker] Recherche... : ', event.request.url);
    event.respondWith(
        caches.match(event.request.url).then(response => {
            if (response) {
                console.log('[Service Worker] retour du cache : ', response.url);
                return response;
            }
            else {
                return fetch(event.request).then(response => {
                    caches.open(CACHE_NAME_DYNAMIC).then(cache => {
                        cache.put(event.request.url, response.clone());
                        console.log('[Service Worker] retour de la requete : ', response);
                        return response;
                    }).catch(error => {
                        console.log('[Service Worker] erreur d\'ouverture du cache dynamic : ', error);
                    });
                }).catch(error => {
                    console.log('[Service Worker] erreur de fetch : ', error);
                    //TODO offline.html
                });
            }
        })
    );
});*/

// Activate SW
self.addEventListener("activate", event => {
    console.log('[Service Worker] [2] Activation du Service Worker...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME_STATIC && key !== CACHE_NAME_DYNAMIC) {
                    console.log('[Service Worker] Suppression du vieux cache : ', key);
                    return caches.delete(key);
                }
            }));
        })
    )
});