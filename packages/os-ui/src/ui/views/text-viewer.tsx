export function TextViewer({ content = "" }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
      {content}
    </pre>
  );
}
