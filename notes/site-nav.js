(function () {
  const scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) {
    throw new Error("Site navigation script must be loaded from a script element.");
  }

  const notesUrl = new URL("index.html", scriptUrl);
  const links = [
    { label: "Tutorials", url: new URL("../index.html", scriptUrl) },
    { label: "All notes", url: notesUrl },
    { label: "Agent Fundamentals", url: new URL("agent-fundamentals/index.html", scriptUrl) }
  ];
  const pageUrl = new URL(window.location.href);
  const isAgentPage = pageUrl.pathname.includes("/notes/agent-fundamentals/");
  const isNotesIndex = pageUrl.pathname.endsWith("/notes/index.html");
  const isTutorialsHome = pageUrl.pathname.endsWith("/index.html") &&
    !pageUrl.pathname.includes("/notes/");

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("site-nav.css", scriptUrl).href;
  document.head.appendChild(stylesheet);

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
})();
