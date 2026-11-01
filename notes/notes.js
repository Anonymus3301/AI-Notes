document.addEventListener("DOMContentLoaded", async () => {
    const md = document.getElementById("md");
    const content = document.getElementById("content");
    const toc = document.getElementById("toc");

    if (!md || !content) return;

    let text = md.textContent.trim();

    // --------------------------------------------------
    // Extract fenced code blocks first
    // --------------------------------------------------

    const codeBlocks = [];

    text = text.replace(
        /```([^\n]*)\n([\s\S]*?)```/g,
        (_, lang, code) => {
            const id = codeBlocks.length;

            codeBlocks.push({
                lang: (lang || "").trim(),
                code: code.trim()
            });

            return `@@CODEBLOCK_${id}@@`;
        }
    );

    // --------------------------------------------------
    // Headings with custom ids
    // --------------------------------------------------

    text = text.replace(
        /^###\s+(.*?)\s+\{#([^}]+)\}$/gm,
        '<h3 id="$2">$1</h3>'
    );

    text = text.replace(
        /^##\s+(.*?)\s+\{#([^}]+)\}$/gm,
        '<h2 id="$2">$1</h2>'
    );

    text = text.replace(
        /^#\s+(.*?)\s+\{#([^}]+)\}$/gm,
        '<h1 id="$2">$1</h1>'
    );

    text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // --------------------------------------------------
    // Basic markdown
    // --------------------------------------------------

    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    text = text.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    text = text.replace(
        /\[([^\]]+)]\(([^)]+)\)/g,
        '<a href="$2">$1</a>'
    );

    // --------------------------------------------------
    // Restore code blocks
    // --------------------------------------------------

    text = text.replace(
        /@@CODEBLOCK_(\d+)@@/g,
        (_, i) => {
            const block = codeBlocks[+i];

            if (
                block.lang.toLowerCase() === "mermaid"
            ) {
                return `
<div class="mermaid">
${escapeHtml(block.code)}
</div>`;
            }

            return `
<pre>
<code class="language-${block.lang}">
${escapeHtml(block.code)}
</code>
</pre>`;
        }
    );

    content.innerHTML = text;

    // --------------------------------------------------
    // Auto ids for headings
    // --------------------------------------------------

    content.querySelectorAll(
        "h1,h2,h3,h4,h5,h6"
    ).forEach(h => {

        if (!h.id) {
            h.id = h.textContent
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-");
        }
    });

    // --------------------------------------------------
    // TOC
    // --------------------------------------------------

    if (toc) {

        const headings =
            content.querySelectorAll("h2,h3");

        const title =
            document.createElement("strong");

        title.textContent = "Contents";

        const ul =
            document.createElement("ul");

        ul.className = "toc-list";

        headings.forEach(h => {

            const li =
                document.createElement("li");

            if (h.tagName === "H3") {
                li.classList.add("toc-sub");
            }

            const a =
                document.createElement("a");

            a.href = "#" + h.id;
            a.textContent = h.textContent;

            li.appendChild(a);
            ul.appendChild(li);
        });

        toc.innerHTML = "";
        toc.appendChild(title);
        toc.appendChild(ul);
    }

    // --------------------------------------------------
    // Copy buttons
    // --------------------------------------------------

    content.querySelectorAll("pre")
        .forEach(pre => {

            const btn =
                document.createElement("button");

            btn.className = "copy";
            btn.textContent = "Copy";

            btn.addEventListener("click",
                async () => {

                    const code =
                        pre.querySelector("code")
                            ?.innerText || "";

                    try {

                        await navigator
                            .clipboard
                            .writeText(code);

                        btn.textContent = "Copied!";

                        setTimeout(() => {
                            btn.textContent =
                                "Copy";
                        }, 1500);

                    } catch {

                        btn.textContent =
                            "Failed";

                        setTimeout(() => {
                            btn.textContent =
                                "Copy";
                        }, 1500);
                    }
                });

            pre.appendChild(btn);
        });

    // --------------------------------------------------
    // Mermaid
    // --------------------------------------------------

    if (
        window.mermaid &&
        document.querySelector(".mermaid")
    ) {

        mermaid.initialize({
            startOnLoad: false,
            securityLevel: "loose"
        });

        await mermaid.run();
    }

    // --------------------------------------------------
    // TOC active section
    // --------------------------------------------------

    const tocLinks = [
        ...document.querySelectorAll("#toc a")
    ];

    if (tocLinks.length) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (!entry.isIntersecting)
                            return;

                        tocLinks.forEach(link =>
                            link.classList.remove(
                                "active"
                            )
                        );

                        const active =
                            document.querySelector(
                                `#toc a[href="#${entry.target.id}"]`
                            );

                        active?.classList.add(
                            "active"
                        );
                    });

                },
                {
                    rootMargin:
                        "-20% 0px -70% 0px"
                }
            );

        content
            .querySelectorAll("h2,h3")
            .forEach(h =>
                observer.observe(h)
            );
    }

    // --------------------------------------------------
    // Hash navigation
    // --------------------------------------------------

    if (location.hash) {

        const target =
            document.querySelector(
                location.hash
            );

        if (target) {

            setTimeout(() => {

                target.scrollIntoView({
                    block: "start"
                });

            }, 100);
        }
    }

    // --------------------------------------------------
    // External links
    // --------------------------------------------------

    content.querySelectorAll("a")
        .forEach(link => {

            const href =
                link.getAttribute("href");

            if (
                href &&
                /^https?:\/\//i.test(href)
            ) {
                link.target = "_blank";
                link.rel =
                    "noopener noreferrer";
            }
        });
});

function escapeHtml(text) {
    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}