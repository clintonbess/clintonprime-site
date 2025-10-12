import React from "react";
import { Kernel } from "./kernel/kernel";

export function DropZone() {
  const [over, setOver] = React.useState(false);

  React.useEffect(() => {
    function prevent(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
    }
    function dragenter(e: DragEvent) {
      prevent(e);
      setOver(true);
    }
    function dragover(e: DragEvent) {
      prevent(e);
      setOver(true);
    }
    function dragleave(e: DragEvent) {
      prevent(e);
      setOver(false);
    }
    async function drop(e: DragEvent) {
      prevent(e);
      setOver(false);
      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length) return;
      // convert first acceptable file to NeoFileDescriptor via FS
      const f = files.find(
        (f) => f.name.endsWith(".mp3") || f.name.endsWith(".neoaudio.json")
      );
      if (!f) return;
      const desc = await Kernel.fs.audio.fromLocalFile(f);
      // Notify active app(s)
      Kernel.events.emit("audio:file:dropped", desc);
    }

    window.addEventListener("dragenter", dragenter);
    window.addEventListener("dragover", dragover);
    window.addEventListener("dragleave", dragleave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", dragenter);
      window.removeEventListener("dragover", dragover);
      window.removeEventListener("dragleave", dragleave);
      window.removeEventListener("drop", drop);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 transition ${
        over
          ? "bg-black/30 outline outline-2 outline-green-400"
          : "bg-transparent"
      }`}
    >
      {over && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="rounded-xl bg-black/70 px-6 py-3 text-green-300 shadow-lg">
            Drop MP3 or .neoaudio.json to play
          </div>
        </div>
      )}
    </div>
  );
}
