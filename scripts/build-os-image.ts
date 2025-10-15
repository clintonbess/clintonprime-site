import { zip } from "zip-a-folder";
import path from "node:path";
import fs from "node:fs";

async function main() {
  const sourceDir = path.resolve("os-image");
  const outDir = path.resolve("apps/web/public/assets");
  const outZip = path.join(outDir, "os-image-v1.zip");

  if (!fs.existsSync(sourceDir)) {
    console.error(`[build-os-image] Missing source dir: ${sourceDir}`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  await zip(sourceDir, outZip);
  const bytes = fs.statSync(outZip).size;
  console.log(
    `[build-os-image] Wrote ${outZip} (${(bytes / 1024).toFixed(1)} KB)`
  );
}

main().catch((err) => {
  console.error("[build-os-image] Failed:", err);
  process.exit(1);
});
