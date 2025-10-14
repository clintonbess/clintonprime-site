import React from "react";
import type { FS } from "@clintonprime/types";

function guessMime(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export function FSImage({
  fs,
  path,
  alt,
  className,
  onErrorFallback,
}: {
  fs: FS;
  path: string;
  alt?: string;
  className?: string;
  onErrorFallback?: React.ReactNode; // e.g. <i className="fa ..."/>
}) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        // If the path is a normal HTTP URL, just pass it through
        if (/^https?:\/\//i.test(path)) {
          setSrc(path);
          return;
        }

        // Virtual FS path: read -> Blob -> objectURL
        const mime = guessMime(path);

        // If svg and you prefer data URL, you can read as text:
        if (mime === "image/svg+xml") {
          const txt = await fs.readFile(path, { encoding: "utf8" });
          if (cancelled) return;
          const dataUrl =
            "data:image/svg+xml;charset=utf-8," +
            encodeURIComponent(String(txt));
          setSrc(dataUrl);
          return;
        }

        // Otherwise binary
        const bytes = (await fs.readFile(path)) as Uint8Array;
        if (cancelled) return;
        const url = URL.createObjectURL(
          new Blob([bytes as any], { type: mime })
        );
        revoked = url;
        setSrc(url);
      } catch (e) {
        console.warn("[FSImage] load failed:", path, e);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [fs, path]);

  if (failed) {
    return (
      onErrorFallback ?? (
        <span className={className} aria-label={alt}>
          □
        </span>
      )
    );
  }
  if (!src) return <span className={className} aria-label={alt} />;

  return <img src={src} alt={alt} className={className} draggable={false} />;
}
