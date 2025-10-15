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

// Configure marked with custom rendering (v5+ safe)
const renderer: RendererObject = {
  // Highlight fenced code blocks with highlight.js
  code({ text, lang }) {
    const sourceCode = text || "";
    // Map short aliases to registered languages
    const alias =
      lang === "ts" ? "typescript" : lang === "js" ? "javascript" : lang;
    const fallback = "typescript";
    const language = alias && hljs.getLanguage(alias) ? alias : fallback;
    const highlighted = hljs.highlight(sourceCode, { language }).value;

    return `
      <pre class="code-editor font-mono text-sm leading-tight">
        <code class="hljs ${language}">${highlighted}</code>
      </pre>
    `;
  },
  // Ensure inline/raw HTML blocks render as actual HTML (not escaped)
  html({ raw }) {
    return raw ?? "";
  },
};

marked.use({ renderer, gfm: true, breaks: false, async: false });

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

    const highlighted = hljs.highlight(src, { language: "typescript" }).value;
    el.innerHTML = `
      <div class="code-editor font-mono text-sm leading-tight">
        <pre class="code-line">${highlighted}</pre>
      </div>
      ${footer}
    `;
    return el;
  }

  // Markdown mode (async-safe). marked.parse may be Promise<string> if async.
  const html = await marked.parse(src);
  el.innerHTML = html;
  return el;
}
