import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

/**
 * Resolve absolute path to a .env file by walking up from a starting directory.
 * If envFileName is not provided, ".env" is used.
 */
export function resolveEnvPath(
  startDir: string = process.cwd(),
  envFileName: string = ".env"
): string | null {
  let current: string = path.resolve(startDir);
  const root: string = path.parse(current).root;

  while (true) {
    const candidate: string = path.join(current, envFileName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    if (current === root) {
      return null;
    }
    current = path.dirname(current);
  }
}

/**
 * Load dotenv using a resolved .env path. Optionally specify a filename like ".env.local".
 * Returns the loaded path, or null if not found.
 */
export function loadDotenvFromNearest(
  startDir?: string,
  envFileName?: string
): string | null {
  const envPath = resolveEnvPath(startDir, envFileName);
  if (envPath) {
    dotenv.config({ path: envPath });
    return envPath;
  }
  return null;
}
