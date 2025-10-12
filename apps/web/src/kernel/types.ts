export type NeoFileType =
  | import("@clintonprime/types").osFile.NeoFileType
  | "neo/clip"
  | string;

export type NeoFileDescriptor =
  import("@clintonprime/types").osFile.NeoFileDescriptor & {
    id?: string;
    meta?: Record<string, any>;
    blobUrl?: string;
    cached?: boolean;
  };

export type NeoAppManifest = import("@clintonprime/types").osApp.NeoAppManifest;
export type NeoEventBus = import("@clintonprime/types").osKernel.NeoEventBus;
export type NeoFS = import("@clintonprime/types").osKernel.NeoFS;
export type NeoPlayerHost =
  import("@clintonprime/types").osKernel.NeoPlayerHost;
export type NeoContext = import("@clintonprime/types").osKernel.NeoContext;

export type NeoKind = import("@clintonprime/types").NeoKind;
export type NeoFileBase = import("@clintonprime/types").NeoFileBase;
export type NeoFileMusic = import("@clintonprime/types").NeoFileMusic;
