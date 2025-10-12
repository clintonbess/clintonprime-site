import React from "react";
import { createRoot } from "react-dom/client";
import type { NeoContext, NeoFileDescriptor } from "../../kernel/types";

function MusicPlayer({ ctx }: { ctx: NeoContext }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = React.useState<NeoFileDescriptor | null>(null);

  React.useEffect(() => {
    // Handle drag-and-drop from DropZone
    return ctx.events.on<NeoFileDescriptor>(
      "audio:file:dropped",
      async (desc) => {
        setCurrent(desc);
        if (audioRef.current) {
          audioRef.current.src = desc.blobUrl!;
          await audioRef.current.play();
        }
      }
    );
  }, []);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl">music_player</h2>
      <div className="rounded bg-gray-800 p-3">
        <div className="mb-2 text-sm opacity-80">
          {current ? (
            <>
              Now Playing: <strong>{current.name}</strong>
            </>
          ) : (
            "Drop an MP3 to start"
          )}
        </div>
        <audio ref={audioRef} controls className="w-full" />
      </div>
    </div>
  );
}

export function mount(ctx: NeoContext) {
  // Listen for drag-and-drop from the global DropZone (or any picker)
  const off = ctx.events.on<NeoFileDescriptor>(
    "audio:file:dropped",
    async (desc) => {
      if (desc.blobUrl) await ctx.player.play({ url: desc.blobUrl });
    }
  );

  // (Optional) also support request/response picker flow:
  ctx.events.on<any>("audio:file:pick", async (req) => {
    // if you later open a modal to choose a track, reply with:
    // ctx.events.emit(req.__reply, chosenNeoFileDescriptor)
  });

  // nothing to render; we piggyback on the site's audio UI
}

export function unmount() {
  // no-op for now
}
