/**
 * makeOsMusicClips.ts
 *
 * Converts all .mp3 files in a given folder into lightweight OS-ready clips.
 * Output: <inputDir>/music-preview/
 *
 * Usage:
 *   pnpm tsx scripts/makeOsMusicClips.ts /path/to/source/mp3s
 */

import { execSync } from "node:child_process";
import { readdirSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, basename, resolve } from "node:path";

const inputDir = process.argv[2];
if (!inputDir) {
  console.error(
    "❌ Usage: pnpm tsx scripts/makeOsMusicClips.ts <input-folder>"
  );
  process.exit(1);
}

const absInput = resolve(inputDir);
const outDir = join(absInput, "music-preview");
if (!existsSync(outDir)) mkdirSync(outDir);

const files = readdirSync(absInput).filter((f) => f.endsWith(".mp3"));

if (files.length === 0) {
  console.error("⚠️ No .mp3 files found in", absInput);
  process.exit(0);
}

for (const file of files) {
  const full = join(absInput, file);
  const base = basename(file, ".mp3");
  const output = join(outDir, `${base}-clip.mp3`);

  try {
    console.log(`🎧 Processing: ${file}`);
    const cmd = [
      "ffmpeg",
      "-y", // overwrite
      "-i",
      `"${full}"`, // input file
      "-t",
      "30", // trim to 30s
      "-ac",
      "1", // mono
      "-ar",
      "22050", // 22kHz sample rate
      "-b:a",
      "96k", // 96 kbps
      `"${output}"`, // output path
    ].join(" ");
    execSync(cmd, { stdio: "inherit" });

    const { size } = statSync(output);
    console.log(
      `✅ Created ${basename(output)} (${(size / 1024).toFixed(0)} KB)`
    );
  } catch (err) {
    console.error(`❌ Error processing ${file}:`, (err as Error).message);
  }
}

console.log(`\n✨ All done! Check: ${outDir}\n`);
