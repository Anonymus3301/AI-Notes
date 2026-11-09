const CACHE_NAME = "ai-notes-pwa-v4";
const PRECACHE_URLS = [
  "./index.html",
  "./mcp.html",
  "./study-links.html",
  "./notes/index.html",
  "./notes/dsa.html",
  "./notes/m1.html",
  "./notes/m2.html",
  "./notes/m3.html",
  "./notes/m4.html",
  "./notes/m5.html",
  "./notes/m6.html",
  "./notes/m7.html",
  "./notes/projects.html",
  "./notes/sd.html",
  "./notes/stack.html",
  "./notes/agent-fundamentals/index.html",
  "./notes/agent-fundamentals/agent-autonomy-levels-and-choosing-the-minimum-sufficient-autonomy.html",
  "./notes/agent-fundamentals/core-agent-loop-observe-decide-act-inspect-results-and-stop.html",
  "./notes/agent-fundamentals/deterministic-workflow-nodes-vs-model-selected-actions.html",
  "./notes/agent-fundamentals/human-in-the-loop-reviews-approvals-and-escalation.html",
  "./notes/agent-fundamentals/llm-workflows-vs-autonomous-agents-when-each-is-appropriate.html",
  "./notes/agent-fundamentals/planning-task-breakdown-dependency-graphs-and-replanning.html",
  "./notes/agent-fundamentals/reasoning-and-acting-patterns-e-g-react-and-tool-use-loops.html",
  "./notes/agent-fundamentals/reflection-critique-self-correction-and-their-limitations.html",
  "./notes/agent-fundamentals/short-term-context-vs-persistent-long-term-memory.html",
  "./notes/agent-fundamentals/stop-conditions-turn-budgets-iteration-limits-and-fallback-paths.html",
  "./notes/rag-foundations/index.html",
  "./notes/rag-foundations/1-foundations.html",
  "./notes/rag-foundations/2-data-ingestion-and-preprocessing.html",
  "./notes/rag-foundations/3-chunking-strategies.html",
  "./notes/rag-foundations/4-embeddings.html",
  "./notes/rag-foundations/5-vector-databases.html",
  "./notes/rag-foundations/6-retrieval-techniques.html",
  "./notes/rag-foundations/7-re-ranking.html",
  "./notes/rag-foundations/8-generation-layer.html",
  "./notes/rag-foundations/9-evaluation.html",
  "./notes/rag-foundations/10-advanced-rag-architectures.html",
  "./notes/rag-foundations/11-types-of-rag-top-4.html",
  "./notes/rag-foundations/12-performance-scaling.html",
  "./notes/rag-foundations/13-security-privacy.html",
  "./notes/rag-foundations/14-production-system-design.html",
  "./notes/rag-foundations/15-real-world-problems-to-practice.html",
  "./notes/rag-foundations/16-emerging-rag-patterns.html",
  "./manifest.webmanifest",
  "./notes/site-nav.css",
  "./notes/site-nav.js",
  "./notes/notes.css",
  "./notes/notes.js",
  "./notes/agent-fundamentals.css",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS.map(path => new URL(path, self.registration.scope))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith("ai-notes-pwa-") && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cachedPage = await caches.match(request, { ignoreSearch: true });
        if (cachedPage) return cachedPage;

        const homePage = await caches.match(new URL("./index.html", self.registration.scope));
        if (homePage) return homePage;
        throw new Error("No cached page is available while offline.");
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
