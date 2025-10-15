import React from "react";
import type { FS, AppManifest } from "@clintonprime/types";
import { FSImage } from "../ui/fs-image";

export const Desktop: React.FC<{
  fs: FS;
  apps: AppManifest[];
  onLaunch: (m: AppManifest) => void;
}> = ({ fs, apps, onLaunch }) => {
  return (
    <div className="absolute top-12 left-4 flex flex-col gap-6 p-2">
      {apps.map((m) => (
        <button
          key={m.id}
          className="flex flex-col items-center gap-2 w-24 focus:outline-none"
          onDoubleClick={() => onLaunch(m)}
        >
          <FSImage
            fs={fs}
            path={m.icon}
            alt={m.name}
            className="w-24 h-24"
            onErrorFallback={
              <i className="fa-solid fa-cube text-3xl text-monokai-green" />
            }
          />
          <div className="text-sm text-center">{m.name}</div>
        </button>
      ))}
    </div>
  );
};
