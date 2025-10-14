export function DirListView({ files = [] }: { files: string[] }) {
  return (
    <div className="font-mono text-sm space-y-1">
      {files.map((f) => (
        <div
          key={f}
          className="hover:bg-white/5 px-2 py-1 rounded cursor-default"
        >
          {f}
        </div>
      ))}
    </div>
  );
}
