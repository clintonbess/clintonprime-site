import React from "react";
import type { FS, AppManifest } from "@clintonprime/types";
import { FSImage } from "../ui/fs-image";

export const Desktop: React.FC<{
  fs: FS;
  apps: AppManifest[];
  onLaunch: (m: AppManifest) => void;
}> = ({ fs, apps, onLaunch }) => {
  return (
    <div className="w-full h-full grid grid-cols-6 gap-8 p-8 place-items-start">
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
            className="w-12 h-12"
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
