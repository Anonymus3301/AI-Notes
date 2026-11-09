(function () {
  const scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) {
    throw new Error("Site navigation script must be loaded from a script element.");
  }

  const notesUrl = new URL("index.html", scriptUrl);
  const links = [
    { label: "Tutorials", url: new URL("../index.html", scriptUrl) },
    { label: "All notes", url: notesUrl },
    { label: "Agent Fundamentals", url: new URL("agent-fundamentals/index.html", scriptUrl) },
    { label: "RAG Foundations", url: new URL("rag-foundations/index.html", scriptUrl) }
  ];
  const pageUrl = new URL(window.location.href);
  const isAgentPage = pageUrl.pathname.includes("/notes/agent-fundamentals/");
  const isRagPage = pageUrl.pathname.includes("/notes/rag-foundations/");
  const isNotesIndex = pageUrl.pathname.endsWith("/notes/index.html");
  const isTutorialsHome = pageUrl.pathname.endsWith("/index.html") &&
    !pageUrl.pathname.includes("/notes/");

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("site-nav.css", scriptUrl).href;
  document.head.appendChild(stylesheet);

  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = new URL("../manifest.webmanifest", scriptUrl).href;
  document.head.appendChild(manifest);

  const appleIcon = document.createElement("link");
  appleIcon.rel = "apple-touch-icon";
  appleIcon.href = new URL("../assets/icons/icon-192.png", scriptUrl).href;
  document.head.appendChild(appleIcon);

  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/svg+xml";
  favicon.href = new URL("../assets/icons/icon.svg", scriptUrl).href;
  document.head.appendChild(favicon);

  const themeColor = document.createElement("meta");
  themeColor.name = "theme-color";
  themeColor.content = "#17365d";
  document.head.appendChild(themeColor);

  const appleAppMode = document.createElement("meta");
  appleAppMode.name = "apple-mobile-web-app-capable";
  appleAppMode.content = "yes";
  document.head.appendChild(appleAppMode);

  const appleAppTitle = document.createElement("meta");
  appleAppTitle.name = "apple-mobile-web-app-title";
  appleAppTitle.content = "AI Notes";
  document.head.appendChild(appleAppTitle);

  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register(new URL("../service-worker.js", scriptUrl))
      .catch(error => console.error("AI Notes service worker registration failed.", error));
  }

  let header = document.querySelector("header.bar");
  let container;
  if (header) {
    container = header;
  } else {
    const existingTop = document.querySelector(".top .wrap");
    if (existingTop) {
      container = existingTop;
    } else {
      header = document.createElement("header");
      header.className = "site-nav-header";
      document.body.insertBefore(header, document.body.firstChild);
      container = header;
    }
  }

  if (container.querySelector(".site-navigation")) return;

  const navigation = document.createElement("nav");
  navigation.className = "site-navigation";
  navigation.setAttribute("aria-label", "Website navigation");

  for (const link of links) {
    if ((isAgentPage && link.label === "Agent Fundamentals") ||
        (isRagPage && link.label === "RAG Foundations") ||
        (isNotesIndex && link.label === "All notes") ||
        (isTutorialsHome && link.label === "Tutorials")) {
      continue;
    }

    const exists = [...container.querySelectorAll("a")].some(anchor => {
      const href = anchor.getAttribute("href");
      return href && new URL(href, pageUrl).href === link.url.href;
    });
    if (exists) continue;

    const anchor = document.createElement("a");
    anchor.href = link.url.href;
    anchor.textContent = link.label;
    navigation.appendChild(anchor);
  }

  if (navigation.childElementCount) {
    const firstLink = container.querySelector("a");
    let insertionPoint = firstLink;
    while (insertionPoint && insertionPoint.parentElement !== container) {
      insertionPoint = insertionPoint.parentElement;
    }
    if (insertionPoint) {
      container.insertBefore(navigation, insertionPoint);
    } else {
      container.insertBefore(navigation, container.firstChild);
    }
  }

  const installButton = document.createElement("button");
  installButton.className = "install-app";
  installButton.type = "button";
  installButton.textContent = "Install app";
  installButton.hidden = true;
  installButton.setAttribute("aria-label", "Install AI Notes app");
  navigation.appendChild(installButton);

  let installPrompt;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;

    const prompt = installPrompt;
    installPrompt = null;
    installButton.hidden = true;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      console.error("AI Notes install prompt failed.", error);
    }
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.hidden = true;
  });
})();
