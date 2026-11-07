const fs = require("node:fs");
const path = require("node:path");

const notesDir = __dirname;
const sourceDir = path.join(
  notesDir,
  "..",
  "SDE-Interview-and-Prep-Roadmap-main",
  "Agentic AI, LLM Engineering, and AI System Design",
  "Agent Fundamentals and Decision-Making"
);
const outputDir = path.join(notesDir, "agent-fundamentals");

const descriptions = {
  "agent-autonomy-levels-and-choosing-the-minimum-sufficient-autonomy":
    "Choose the least decision-making freedom needed while balancing scope, reversibility, and risk.",
  "core-agent-loop-observe-decide-act-inspect-results-and-stop":
    "Build bounded observe–decide–act cycles with validated tools, inspected outcomes, and explicit stopping.",
  "deterministic-workflow-nodes-vs-model-selected-actions":
    "Decide which steps should stay fixed and where a model can safely choose actions.",
  "human-in-the-loop-reviews-approvals-and-escalation":
    "Design approval gates, escalation criteria, and resumable human handoffs for consequential actions.",
  "llm-workflows-vs-autonomous-agents-when-each-is-appropriate":
    "Match system autonomy to uncertainty, reliability requirements, cost, and risk.",
  "planning-task-breakdown-dependency-graphs-and-replanning":
    "Decompose goals, model dependencies, manage budgets, and replan as evidence changes.",
  "reasoning-and-acting-patterns-e-g-react-and-tool-use-loops":
    "Use ReAct-style loops and constrained tool calls without confusing reasoning with permission.",
  "reflection-critique-self-correction-and-their-limitations":
    "Apply critique and correction selectively, measuring whether another pass improves output.",
  "short-term-context-vs-persistent-long-term-memory":
    "Separate task context from persistent memory and govern what is stored, recalled, and forgotten.",
  "stop-conditions-turn-budgets-iteration-limits-and-fallback-paths":
    "Bound turns, retries, and action budgets with explicit fallback and escalation behavior."
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inlineMarkdown(value) {
  const code = [];
  let text = value.replace(/`([^`]+)`/g, (_, content) => {
    const token = `@@INLINECODE${code.length}@@`;
    code.push(`<code>${escapeHtml(content)}</code>`);
    return token;
  });

  text = escapeHtml(text);
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, href) => {
      const safeHref = /^(https?:|mailto:|#|\.{0,2}\/)/i.test(href)
        ? href
        : "#";
      const external = /^https?:/i.test(safeHref)
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return `<a href="${escapeHtml(safeHref)}"${external}>${label}</a>`;
    }
  );
  text = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>");

  return text.replace(/@@INLINECODE(\d+)@@/g, (_, index) => code[index]);
}

function isTableRow(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isTableDivider(line) {
  return isTableRow(line) && /^\s*\|?[\s:|-]+\|?\s*$/.test(line);
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "Agent Fundamentals";
  const headings = [];
  const usedIds = new Set();
  const output = [];
  let index = 0;
  let firstHeadingSkipped = false;

  function headingId(text) {
    const base = slugify(text) || "section";
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) id = `${base}-${suffix++}`;
    usedIds.add(id);
    return id;
  }

  function blockStart(line) {
    return /^(#{1,6}\s|```|>\s?|[-*+]\s|\d+[.)]\s|---\s*$)/.test(line)
      || (isTableRow(line));
  }

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index++;
      continue;
    }

    const fence = line.match(/^```(\S*)\s*$/);
    if (fence) {
      const codeLines = [];
      index++;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        codeLines.push(lines[index++]);
      }
      if (index < lines.length) index++;
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
      output.push(`<pre><code${language}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      index++;
      const level = heading[1].length;
      const text = heading[2].trim();
      if (level === 1 && !firstHeadingSkipped) {
        firstHeadingSkipped = true;
        continue;
      }
      const id = headingId(text);
      if (level === 2 || level === 3) headings.push({ level, id, text });
      output.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    if (isTableRow(line) && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const header = tableCells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(tableCells(lines[index++]));
      }
      output.push(
        `<div class="table-wrap"><table><thead><tr>${header.map(cell => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${header.map((_, column) => `<td>${inlineMarkdown(row[column] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      );
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoted = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoted.push(lines[index++].replace(/^\s*>\s?/, ""));
      }
      output.push(`<blockquote><p>${inlineMarkdown(quoted.join(" "))}</p></blockquote>`);
      continue;
    }

    if (/^\s*([-*+])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const tag = ordered ? "ol" : "ul";
      const items = [];
      while (index < lines.length && (/^\s*([-*+])\s+/.test(lines[index]) || /^\s*\d+[.)]\s+/.test(lines[index]))) {
        items.push(lines[index++].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ""));
      }
      output.push(`<${tag}>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`);
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      output.push("<hr>");
      index++;
      continue;
    }

    const paragraph = [line.trim()];
    index++;
    while (index < lines.length && lines[index].trim() && !blockStart(lines[index])) {
      paragraph.push(lines[index++].trim());
    }
    output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return { title, html: output.join("\n"), headings };
}

function readNote(file) {
  const markdown = fs.readFileSync(path.join(sourceDir, file), "utf8");
  const rendered = renderMarkdown(markdown);
  const firstParagraph = rendered.html.match(/<p>(.*?)<\/p>/);
  const description = descriptions[slugify(path.basename(file, ".md"))] || (firstParagraph
    ? firstParagraph[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").slice(0, 190)
    : "Practical system-design notes for building reliable agents.");
  return {
    file,
    slug: slugify(path.basename(file, ".md")),
    ...rendered,
    description
  };
}

function pageShell({ title, body, toc = "", isIndex = false, previous, next }) {
  const pageLinks = isIndex ? "" : `
  <nav class="bar-pages" aria-label="Adjacent notes">
    ${previous ? `<a href="./${previous.slug}.html" aria-label="Previous note: ${escapeHtml(previous.title)}" title="${escapeHtml(previous.title)}">← Previous</a>` : '<span aria-disabled="true">← Previous</span>'}
    ${next ? `<a href="./${next.slug}.html" aria-label="Next note: ${escapeHtml(next.title)}" title="${escapeHtml(next.title)}">Next →</a>` : '<span aria-disabled="true">Next →</span>'}
  </nav>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHtml(title)} — Agent Fundamentals notes">
<title>${escapeHtml(title)} | Agent Fundamentals</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../agent-fundamentals.css">
<script src="../site-nav.js" defer></script>
</head>
<body>
<header class="bar">
  <nav class="bar-links" aria-label="Main navigation">
    <a href="${isIndex ? "../index.html" : "./index.html"}">${isIndex ? "← All notes" : "← Agent Fundamentals"}</a>
    <a href="../m5.html">Module 5: Agentic AI Systems</a>
  </nav>${pageLinks}
  <span class="grow"></span>
  ${isIndex ? "" : '<button type="button" onclick="window.print()">Print / PDF</button>'}
</header>
${isIndex ? "" : `<div class="layout"><nav class="toc" aria-label="Contents"><strong>On this page</strong>${toc}</nav>`}
<main>
${body}
</main>
${isIndex ? "" : "</div>"}
${isIndex ? "" : `<script>
const links = [...document.querySelectorAll(".toc a")];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    links.forEach(link => link.classList.toggle("active", link.hash === "#" + entry.target.id));
  }
}, { rootMargin: "-15% 0px -72% 0px" });
document.querySelectorAll("main h2[id], main h3[id]").forEach(heading => observer.observe(heading));
</script>`}
</body>
</html>
`;
}

function build() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Agent Fundamentals source folder not found: ${sourceDir}`);
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right));
  const notes = files.map(readNote);

  for (let index = 0; index < notes.length; index++) {
    const note = notes[index];
    const previous = notes[index - 1];
    const next = notes[index + 1];
    const toc = note.headings.map(heading =>
      `<a class="${heading.level === 3 ? "sub" : ""}" href="#${heading.id}">${escapeHtml(heading.text)}</a>`
    ).join("\n");
    const pageNavigation = `<nav class="page-nav" aria-label="Note navigation">${previous ? `<a href="./${previous.slug}.html">← ${escapeHtml(previous.title)}</a>` : "<span></span>"}${next ? `<a href="./${next.slug}.html">${escapeHtml(next.title)} →</a>` : ""}</nav>`;
    const body = `<header class="cover"><h1>${escapeHtml(note.title)}</h1><p class="sub">Agent Fundamentals and Decision-Making · Note ${index + 1} of ${notes.length}</p></header>\n<article>${note.html}</article>\n${pageNavigation}`;
    fs.writeFileSync(
      path.join(outputDir, `${note.slug}.html`),
      pageShell({ title: note.title, body, toc, previous, next }),
      "utf8"
    );
  }

  const cards = notes.map((note, index) =>
    `<a class="card" href="./${note.slug}.html"><strong>${escapeHtml(note.title)}</strong><span>${escapeHtml(note.description)}${note.description.length === 190 ? "…" : ""}</span><span>Note ${index + 1} of ${notes.length} · Read note →</span></a>`
  ).join("\n");
  const body = `<header class="cover"><h1>Agent Fundamentals and Decision-Making</h1><p class="sub">A practical guide to agent loops, autonomy, planning, tools, memory, reflection, and safe stopping.</p></header>\n<section class="cards" aria-label="Agent fundamentals notes">${cards}</section>`;
  fs.writeFileSync(
    path.join(outputDir, "index.html"),
    pageShell({ title: "Agent Fundamentals and Decision-Making", body, isIndex: true }),
    "utf8"
  );
  console.log(`Generated ${notes.length} Agent Fundamentals pages in ${outputDir}`);
}

build();
