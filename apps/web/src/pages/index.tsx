// apps/web/src/pages/index.tsx
import { useEffect, useRef } from "react";
import { MountableFS, OverlayFS, MemoryFS } from "@clintonprime/os-core";
import { bootOS } from "@clintonprime/os-ui";
import { loadSystemImageToMemoryFS } from "../boot/fs-from-zip";

export default function IndexPage() {
  const osContainerRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef<null | { unmount: () => void }>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined") return;
      const target = osContainerRef.current;
      if (!target || target.dataset.booted === "1") return;

      // FS mounts
      const router = new MountableFS();
      const lower = await loadSystemImageToMemoryFS("/assets/os-image-v1.zip");
      const upper = new MemoryFS();
      router
        .mount("/system", new OverlayFS(upper, lower))
        .mount("/home", new MemoryFS())
        .mount("/music", new MemoryFS());

      if (cancelled) return;

      // Boot once
      const { root } = await bootOS({ fs: router, target });
      target.dataset.booted = "1";
      bootRef.current = { unmount: () => root.unmount() };

      // @ts-ignore for quick dev pokes
      window.__fs = router;
    })().catch((e) => {
      console.error("OS boot failed:", e);
      if (osContainerRef.current) {
        osContainerRef.current.innerHTML = `<pre style="color:#f55">${String(
          e
        )}</pre>`;
      }
    });

    return () => {
      cancelled = true;
      if (bootRef.current) {
        bootRef.current.unmount();
        bootRef.current = null;
        if (osContainerRef.current)
          delete osContainerRef.current.dataset.booted;
      }
    };
  }, []);

  return <div ref={osContainerRef} className="relative w-full min-h-[80vh]" />;
}
