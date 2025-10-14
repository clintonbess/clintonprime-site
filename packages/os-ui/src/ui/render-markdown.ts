import { marked, type RendererObject } from "marked";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);

export type MarkdownStyle = "plain" | "code" | "md";

// Simple HTML escaper — used only for plain text rendering
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Configure marked with custom code rendering (v5+ safe)
const renderer: RendererObject = {
  code({ raw, lang }) {
    const code = raw || "";
    const language = lang || "typescript";
    const validLang =
      language && hljs.getLanguage(language) ? language : "typescript";
    const highlighted = hljs.highlight(code, { language: validLang }).value;

    return `
      <pre class="code-editor font-mono text-sm leading-tight">
        <code class="hljs ${validLang}">${highlighted}</code>
      </pre>
    `;
  },
};

// ✅ Allow raw HTML rendering by setting `async: false` and `hooks` overrides
marked.use({
  renderer,
  gfm: true,
  breaks: false,
  async: false,
  hooks: {
    // This hook allows HTML tags through untouched
    preprocess(markdown) {
      return markdown;
    },
    postprocess(html) {
      return html;
    },
  },
});

/**
 * Renders Monokai-themed markdown or code snippet.
 */
export async function renderMarkdown(src: string, style: MarkdownStyle = "md") {
  const el = document.createElement("div");
  el.className = `markdown-view markdown-${style}`;

  if (style === "plain") {
    el.innerHTML = `
      <pre class="font-mono text-sm leading-tight whitespace-pre-wrap">
        ${escapeHtml(src)}
      </pre>
    `;
    return el;
  }

  if (style === "code") {
    let footer = "";
    if (src.includes("// ✨ footer:")) {
      const match = src.split("// ✨ footer:")[1].trim();
      footer = `<div class="text-center text-xl font-semibold text-monokai-cyan mt-3">${match}</div>`;
    }

    const highlighted = hljs.highlight(src, { language: "javascript" }).value;
    el.innerHTML = `
      <div class="code-editor font-mono text-sm leading-tight">
        <pre class="code-line">${highlighted}</pre>
      </div>
      ${footer}
    `;
    return el;
  }

  // Markdown mode (async-safe)
  const html = await marked.parse(src);
  el.innerHTML = html;
  return el;
}
