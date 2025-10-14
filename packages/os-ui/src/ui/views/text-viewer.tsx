import React, { useEffect, useRef } from "react";
import { renderMarkdown } from "../render-markdown";

/**
 * TextViewer — renders markdown or plain text content
 * Uses Monokai tokens for syntax highlighting.
 */
export function TextViewer({
  content = "",
  style = "md",
}: {
  content?: string;
  style?: "md" | "plain" | "code";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const el = await renderMarkdown(content, style);
      if (ref.current) {
        ref.current.innerHTML = ""; // clear existing
        ref.current.appendChild(el);
      }
    })();
  }, [content, style]);

  return <div ref={ref} className="markdown-view" />;
}
