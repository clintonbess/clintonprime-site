import type { FS } from "@clintonprime/types";
import type { AppModule } from "./app-manager";

export async function importFromFS(fs: FS, path: string): Promise<AppModule> {
  const code = await fs.readFile(path, { encoding: "utf8" });
  const blob = new Blob([code as string], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  try {
    const mod = await import(/* @vite-ignore */ url);
    return mod as AppModule;
  } finally {
    URL.revokeObjectURL(url);
  }
}
