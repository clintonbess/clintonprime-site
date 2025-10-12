import fs from "node:fs";

const reportFile = "knip-result.json"; // run knip --json > knip-result.json
const allow = new Set(
  fs
    .readFileSync("tools/cleanup-allowlist.txt", "utf8")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
);

function isAllowed(p) {
  for (const a of allow) {
    const pat = a.replace(/\*\*/g, "");
    if (p.includes(pat)) return true;
  }
  return false;
}

const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
const unusedFiles = new Set([
  ...(report?.unused?.files ?? []),
  ...(report?.duplicates ?? []).flatMap((d) => d.files ?? []),
]);

for (const file of unusedFiles) {
  if (isAllowed(file)) continue;
  if (!file.startsWith("apps/") && !file.startsWith("libs/")) continue;
  if (!fs.existsSync(file)) continue;
  console.log("DELETE", file);
  fs.rmSync(file, { recursive: true, force: true });
}
