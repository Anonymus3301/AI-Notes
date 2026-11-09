# AI-Notes
AI Engineering Notes

## Install as an app

The site can be installed from a browser that supports Progressive Web Apps when served over HTTPS (including GitHub Pages) or from localhost. Use the browser's **Install app** action when available; on iOS, use **Share → Add to Home Screen**.

After the service worker finishes its first install, the site's HTML pages and shared assets are available offline. External links and web fonts still require an internet connection. When adding pages or changing offline-cached assets, update the precache list and cache version in [`service-worker.js`](./service-worker.js).
