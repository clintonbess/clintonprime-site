export function DirGridView({ files = [] }: { files: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-3 font-mono text-sm">
      {files.map((f) => (
        <div
          key={f}
          className="border border-white/10 rounded p-2 hover:border-monokai-green"
        >
          <div className="truncate">{f}</div>
        </div>
      ))}
    </div>
  );
}
