// Castle Packaging website — service worker cleanup script
//
// This site has no service worker of its own. This file exists ONLY to
// find and remove a stale, broken service worker that an earlier version
// of this site once installed on some visitors' browsers — it was caching
// image requests under a wrong "castle-website-" prefixed URL, which is
// why product images on the Products page failed to load for anyone whose
// browser had it installed (it kept intercepting image requests and
// serving/re-requesting the wrong, non-existent filename instead of
// letting the real image load).
//
// How it works: browsers periodically re-fetch a site's sw.js to check
// for updates. Any visitor with the old broken service worker installed
// will pick up THIS file the next time they visit, install it (skipping
// the wait), then immediately delete every cache it can see and
// unregister itself — after which the page reloads once, cleanly, with
// no service worker running at all. A brand-new visitor who never had the
// old broken one will simply install this, find nothing to clean up, and
// unregister immediately too.
//
// Safe to delete this file later (e.g. a few weeks from now) once you're
// confident every regular visitor has passed through it — after that,
// there's nothing left for it to clean up.

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      })
      .then(function () {
        return self.registration.unregister();
      })
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (clients) {
        clients.forEach(function (client) { client.navigate(client.url); });
      })
  );
});
