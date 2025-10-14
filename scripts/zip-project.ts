import fs from "fs";
import path from "path";
import { exec } from "child_process";

async function zipTarget(projectRoot: string, target: string) {
  const absTarget = path.resolve(projectRoot, target);
  if (!fs.existsSync(absTarget)) {
    console.error(`❌ Target path does not exist: ${absTarget}`);
    return;
  }

  // Name zip based on target folder
  const baseName = target.replace(/[\\/]/g, "-").replace(/^-+|-+$/g, "");
  const outFile = path.join(
    projectRoot,
    `${baseName || "clintonprime-site"}.zip`
  );

  // Load .gitignore
  const gitignorePath = path.join(projectRoot, ".gitignore");
  let ignorePatterns: string[] = [];

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    ignorePatterns = content
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line && !line.startsWith("#"))
      .map((line) => {
        if (line.endsWith("/")) {
          return [`**/${line}*`, line]; // exclude folder + everything in it
        }
        return [line];
      })
      .flat();
  }

  // Always ignore the zip we’re generating and all node_modules
  ignorePatterns.push(outFile, "**/node_modules/*");

  // Explicit exclusions
  ignorePatterns.push("libs/api/public/*", "libs/api/public/**");

  // Convert ignore patterns to `zip -x`
  const excludeArgs = ignorePatterns.map((p) => `-x '${p}'`).join(" ");

  const cmd = `zip -r -v ${outFile} ${target} ${excludeArgs}`;

  console.log(`📦 Zipping ${target} into ${outFile}...`);
  console.log(`👉 Command: ${cmd}`);

  exec(cmd, { cwd: projectRoot }, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Error creating zip:", err);
      return;
    }
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ Done: ${outFile}`);
  });
}

async function main() {
  const projectRoot = process.cwd();
  const arg = process.argv[2];

  if (!arg || arg === "all") {
    // Zip API and Web app
    await zipTarget(projectRoot, "libs/api");
    await zipTarget(projectRoot, "libs/db");
    await zipTarget(projectRoot, "libs/types");
    await zipTarget(projectRoot, "apps/web");
    await zipTarget(projectRoot, "packages/os-ui");
    await zipTarget(projectRoot, "packages/os-core");
    await zipTarget(projectRoot, "os-image");
  } else {
    // Custom target
    await zipTarget(projectRoot, arg);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
